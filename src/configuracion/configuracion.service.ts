import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as forge from 'node-forge';
import { Empresa } from '../entities/empresa.entity';
import { PuntoVenta } from '../entities/punto-venta.entity';
import { CredencialesArca, EntornoArca } from '../entities/credenciales-arca.entity';
import { encryptSecret, decryptSecret } from '../common/crypto.util';
import { TicketAccesoService } from '../facturacion/ticket-acceso.service';
import { UpdateEmpresaFiscalDto, CreatePuntoVentaDto, UpdatePuntoVentaDto } from './dto/configuracion.dto';
import { GuardarCredencialesArcaDto, ProbarConexionDto } from './dto/credenciales.dto';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(Empresa) private empresaRepository: Repository<Empresa>,
    @InjectRepository(PuntoVenta) private puntoVentaRepository: Repository<PuntoVenta>,
    @InjectRepository(CredencialesArca) private credencialesRepository: Repository<CredencialesArca>,
    private configService: ConfigService,
    private ticketAccesoService: TicketAccesoService,
  ) { }

  // ---------- Empresa (datos fiscales) ----------

  async getEmpresa(idEmpresa: number): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({ where: { id: idEmpresa } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  async updateEmpresa(idEmpresa: number, dto: UpdateEmpresaFiscalDto): Promise<Empresa> {
    const empresa = await this.getEmpresa(idEmpresa);
    Object.assign(empresa, dto);
    return this.empresaRepository.save(empresa);
  }

  // ---------- Puntos de venta ----------

  async listarPuntosVenta(idEmpresa: number): Promise<PuntoVenta[]> {
    return this.puntoVentaRepository.find({
      where: { idEmpresa },
      order: { predeterminado: 'DESC', numero: 'ASC' },
    });
  }

  async crearPuntoVenta(idEmpresa: number, dto: CreatePuntoVentaDto): Promise<PuntoVenta> {
    if (dto.predeterminado) {
      await this.quitarPredeterminado(idEmpresa);
    }
    const pv = this.puntoVentaRepository.create({ ...dto, idEmpresa });
    return this.puntoVentaRepository.save(pv);
  }

  async actualizarPuntoVenta(id: number, idEmpresa: number, dto: UpdatePuntoVentaDto): Promise<PuntoVenta> {
    const pv = await this.puntoVentaRepository.findOne({ where: { id, idEmpresa } });
    if (!pv) throw new NotFoundException('Punto de venta no encontrado');
    if (dto.predeterminado) {
      await this.quitarPredeterminado(idEmpresa);
    }
    Object.assign(pv, dto);
    return this.puntoVentaRepository.save(pv);
  }

  async eliminarPuntoVenta(id: number, idEmpresa: number): Promise<void> {
    const pv = await this.puntoVentaRepository.findOne({ where: { id, idEmpresa } });
    if (!pv) throw new NotFoundException('Punto de venta no encontrado');
    await this.puntoVentaRepository.remove(pv);
  }

  private async quitarPredeterminado(idEmpresa: number) {
    await this.puntoVentaRepository.update({ idEmpresa, predeterminado: true }, { predeterminado: false });
  }

  // ---------- Credenciales ARCA ----------

  async getCredenciales(idEmpresa: number) {
    const creds = await this.credencialesRepository.find({
      where: { idEmpresa },
      order: { entorno: 'ASC', id: 'DESC' },
    });
    return creds.map(c => ({
      id: c.id,
      entorno: c.entorno,
      vencimiento: c.vencimiento,
      activo: c.activo,
      updatedAt: c.updatedAt,
    }));
  }

  async guardarCredenciales(idEmpresa: number, dto: GuardarCredencialesArcaDto): Promise<{ id: number; entorno: string; vencimiento: string | null }> {
    const masterKey = this.configService.get<string>('ARCA_MASTER_KEY');
    if (!masterKey) throw new BadRequestException('Falta ARCA_MASTER_KEY en la configuración del servidor');

    // Validar certificado y clave y obtener el vencimiento
    let vencimiento: string | null = null;
    try {
      const cert = forge.pki.certificateFromPem(dto.certificado);
      vencimiento = cert.validity?.notAfter
        ? new Date(cert.validity.notAfter).toISOString().slice(0, 10)
        : null;
      // La clave se valida al parsearla (si es inválida, lanza)
      forge.pki.privateKeyFromPem(dto.clavePrivada);
    } catch (e) {
      throw new BadRequestException('Certificado o clave privada inválidos');
    }

    const claveCifrada = encryptSecret(dto.clavePrivada, masterKey);

    // Una credencial por entorno: desactivar la anterior y guardar la nueva
    await this.credencialesRepository.update({ idEmpresa, entorno: dto.entorno }, { activo: false });

    const cred = this.credencialesRepository.create({
      idEmpresa,
      entorno: dto.entorno,
      certificado: dto.certificado,
      clavePrivadaCifrada: claveCifrada,
      vencimiento,
      activo: true,
    });
    const saved = await this.credencialesRepository.save(cred);
    return { id: saved.id, entorno: saved.entorno, vencimiento: saved.vencimiento };
  }

  async probarConexion(idEmpresa: number, dto: ProbarConexionDto) {
    const entorno = (dto.entorno || this.configService.get<string>('ARCA_ENTORNO') || EntornoArca.HOMOLOGACION) as EntornoArca;
    const cred = await this.credencialesRepository.findOne({
      where: { idEmpresa, entorno, activo: true },
      order: { id: 'DESC' },
    });
    if (!cred) throw new BadRequestException(`No hay credenciales cargadas para el entorno ${entorno}`);

    const empresa = await this.getEmpresa(idEmpresa);
    if (!empresa.cuit) throw new BadRequestException('La empresa no tiene CUIT');

    const masterKey = this.configService.get<string>('ARCA_MASTER_KEY');
    if (!masterKey) throw new BadRequestException('Falta ARCA_MASTER_KEY en la configuración del servidor');

    const clavePrivada = decryptSecret(cred.clavePrivadaCifrada, masterKey);
    const ta = await this.ticketAccesoService.obtenerTicket(
      idEmpresa,
      entorno,
      (empresa.cuit || '').replace(/\D/g, ''),
      cred.certificado,
      clavePrivada,
    );

    return {
      ok: true,
      entorno,
      expirationTime: ta.expirationTime,
    };
  }
}
