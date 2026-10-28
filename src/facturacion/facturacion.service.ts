import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Venta } from '../entities/venta.entity';
import { Comprobante, EstadoComprobante } from '../entities/comprobante.entity';
import { CredencialesArca, EntornoArca } from '../entities/credenciales-arca.entity';
import { Cliente } from '../entities/cliente.entity';
import { PuntoVenta } from '../entities/punto-venta.entity';
import { Empresa } from '../entities/empresa.entity';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { EstadoMovimiento } from '../entities/movimiento.types';
import { decryptSecret } from '../common/crypto.util';
import { TicketAccesoService } from './ticket-acceso.service';
import { PdfFacturaService } from './pdf.service';
import { SpacesService } from '../spaces/spaces.service';
import { WsfeService, FeDetReq } from './wsfe.service';
import { CopiaComprobante } from './dto/pdf-factura.dto';
import {
  IVA_ALICUOTA_IDS,
  CONDICION_IVA_IDS,
  MONEDA_PESOS,
  buildCodigoBarras,
  TipoComprobanteArca,
} from './arca.constants';
import { EmitirFacturaDto } from './dto/emitir-factura.dto';

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatDateYYYYMMDD(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function yyyymmddToIso(s: string): string {
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
}

export function letraTipoComprobante(tipo: number): string {
  const map: Record<number, string> = {
    [TipoComprobanteArca.FACTURA_A]: 'A',
    [TipoComprobanteArca.FACTURA_B]: 'B',
    [TipoComprobanteArca.FACTURA_C]: 'C',
  };
  return map[tipo] ?? '';
}

export interface ItemFiscal {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioNeto: number;
  alicuotaIva: number;
  subtotalNeto: number;
  subtotalConIva: number;
}

export interface DesgloseIva {
  items: ItemFiscal[];
  netoGravado: number;
  impIVA: number;
  impTotal: number;
  ivaPorAlicuota: { id: number; alicuota: number; baseImp: number; importe: number }[];
}

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(Venta) private ventaRepository: Repository<Venta>,
    @InjectRepository(Comprobante) private comprobanteRepository: Repository<Comprobante>,
    @InjectRepository(CredencialesArca) private credencialesRepository: Repository<CredencialesArca>,
    @InjectRepository(Cliente) private clienteRepository: Repository<Cliente>,
    @InjectRepository(PuntoVenta) private puntoVentaRepository: Repository<PuntoVenta>,
    @InjectRepository(Empresa) private empresaRepository: Repository<Empresa>,
    private configService: ConfigService,
    private ticketAccesoService: TicketAccesoService,
    private wsfeService: WsfeService,
    private pdfService: PdfFacturaService,
    private spacesService: SpacesService,
  ) { }

  /** Listado de ventas con su estado fiscal, para la pantalla de Ventas. */
  async listarVentas(idEmpresa: number, page = 1, limit = 20) {
    const qb = this.ventaRepository.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.cajaPuesto', 'caja')
      .where('venta.idEmpresa = :idEmpresa', { idEmpresa })
      .orderBy('venta.fecha', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [ventas, total] = await qb.getManyAndCount();

    const ids = ventas.map(v => v.id);
    const comprobantes = ids.length
      ? await this.comprobanteRepository.find({ where: { idVenta: In(ids) } })
      : [];
    const porVenta = new Map(comprobantes.map(c => [c.idVenta, c]));

    const data = ventas.map(v => ({
      id: v.id,
      fecha: v.fecha,
      total: Number(v.total),
      tipoPago: v.tipoPago,
      cliente: v.cliente,
      comprobante: porVenta.get(v.id) || null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findVenta(idVenta: number, idEmpresa: number) {
    const venta = await this.ventaRepository.findOne({
      where: { id: idVenta, idEmpresa },
      relations: ['cliente', 'cajaPuesto', 'movimientos', 'movimientos.producto'],
    });
    if (!venta) throw new NotFoundException(`Venta ${idVenta} no encontrada`);

    const comprobante = await this.comprobanteRepository.findOne({ where: { idVenta } });
    return { venta, comprobante: comprobante || null };
  }

  /**
   * Simula el comprobante de una venta sin emitirlo: devuelve exactamente
   * los datos que se enviarían a ARCA (sin CAE ni número asignado).
   */
  async simular(idVenta: number, dto: EmitirFacturaDto, idEmpresa: number) {
    const p = await this.prepararEmision(idVenta, dto, idEmpresa);
    return {
      venta: { id: p.venta.id, fecha: p.venta.fecha, tipoPago: p.venta.tipoPago },
      empresa: {
        razonSocial: p.empresa.razonSocial || p.empresa.nombre,
        cuit: p.cuit,
      },
      tipoComprobante: p.receptor.tipoComprobante,
      letra: letraTipoComprobante(p.receptor.tipoComprobante),
      puntoVenta: p.puntoVenta.numero,
      receptor: {
        nombre: p.cliente?.nombre || 'Consumidor Final',
        cuit: p.cliente?.cuit || '',
        docTipo: p.receptor.docTipo,
        docNro: p.receptor.docNro,
        condicionIva: p.cliente?.condicionIva || 'Consumidor Final',
      },
      items: p.desglose.items,
      netoGravado: p.desglose.netoGravado,
      impIVA: p.desglose.impIVA,
      impTotal: p.desglose.impTotal,
      ivaPorAlicuota: p.desglose.ivaPorAlicuota,
    };
  }

  /** Valida la venta y resuelve cliente, empresa, punto de venta y desglose de IVA. Sin efectos. */
  private async prepararEmision(idVenta: number, dto: EmitirFacturaDto, idEmpresa: number) {
    const venta = await this.ventaRepository.findOne({
      where: { id: idVenta, idEmpresa },
      relations: ['cajaPuesto', 'cliente', 'movimientos', 'movimientos.producto'],
    });
    if (!venta) throw new NotFoundException(`Venta ${idVenta} no encontrada`);

    const existente = await this.comprobanteRepository.findOne({ where: { idVenta } });
    if (existente) {
      throw new ConflictException('La venta ya tiene un comprobante emitido');
    }

    if (!venta.movimientos?.length) {
      throw new BadRequestException('La venta no tiene ítems para facturar');
    }
    const movimientosActivos = venta.movimientos.filter(m => m.estado === EstadoMovimiento.ACTIVO);
    if (!movimientosActivos.length) {
      throw new BadRequestException('La venta no tiene ítems activos para facturar');
    }

    let cliente = venta.cliente;
    if (dto?.idCliente) {
      cliente = await this.clienteRepository.findOne({ where: { id: dto.idCliente, idEmpresa } });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');
    }

    const empresa = await this.empresaRepository.findOne({ where: { id: idEmpresa } });
    if (!empresa?.cuit) throw new BadRequestException('La empresa no tiene CUIT configurado');
    const cuit = empresa.cuit.replace(/\D/g, '');

    const puntoVenta = await this.resolverPuntoVenta(venta, idEmpresa);
    const receptor = this.resolverReceptor(cliente);
    const desglose = this.desglosarIva(movimientosActivos);

    return { venta, cliente, empresa, cuit, puntoVenta, receptor, desglose };
  }

  /** Emite el comprobante electrónico de una venta. Una sola vez por venta. */
  async emitir(idVenta: number, dto: EmitirFacturaDto, idEmpresa: number) {
    const p = await this.prepararEmision(idVenta, dto, idEmpresa);
    const { venta, cliente, empresa, cuit, puntoVenta, receptor, desglose } = p;

    // El cliente elegido al facturar queda registrado en la venta
    if (dto?.idCliente && venta.idCliente !== dto.idCliente) {
      venta.idCliente = dto.idCliente;
    }

    const entorno = (dto?.entorno || this.configService.get<string>('ARCA_ENTORNO') || EntornoArca.HOMOLOGACION) as EntornoArca;
    const credencial = await this.credencialesRepository.findOne({
      where: { idEmpresa, entorno, activo: true },
      order: { id: 'DESC' },
    });
    if (!credencial) {
      throw new BadRequestException(`No hay credenciales ARCA cargadas para el entorno ${entorno}`);
    }

    const masterKey = this.configService.get<string>('ARCA_MASTER_KEY');
    if (!masterKey) throw new BadRequestException('Falta ARCA_MASTER_KEY en la configuración del servidor');
    const clavePrivada = decryptSecret(credencial.clavePrivadaCifrada, masterKey);

    const ta = await this.ticketAccesoService.obtenerTicket(
      idEmpresa,
      entorno,
      cuit,
      credencial.certificado,
      clavePrivada,
    );
    const auth = { token: ta.token, sign: ta.sign, cuit };

    const ultimo = await this.wsfeService.ultimoAutorizado(entorno, auth, puntoVenta.numero, receptor.tipoComprobante);
    const cbteDesde = ultimo + 1;
    const cbteFch = formatDateYYYYMMDD(new Date());

    const feDet: FeDetReq = {
      Concepto: 1,
      DocTipo: receptor.docTipo,
      DocNro: receptor.docNro,
      CbteDesde: cbteDesde,
      CbteHasta: cbteDesde,
      CbteFch: cbteFch,
      ImpTotal: round2(desglose.impTotal),
      ImpTotConc: 0,
      ImpNeto: round2(desglose.netoGravado),
      ImpOpEx: 0,
      ImpIVA: round2(desglose.impIVA),
      ImpTrib: 0,
      MonId: MONEDA_PESOS,
      MonCotiz: 1,
      CondicionIVAReceptorId: receptor.condicionIvaId,
    };
    if (desglose.ivaPorAlicuota.length > 0) {
      feDet.Iva = {
        AlicIva: desglose.ivaPorAlicuota.map(a => ({
          Id: a.id,
          BaseImp: round2(a.baseImp),
          Importe: round2(a.importe),
        })),
      };
    }

    const resultado = await this.wsfeService.solicitarCae(entorno, auth, {
      FeCabReq: { CantReg: 1, PtoVta: puntoVenta.numero, CbteTipo: receptor.tipoComprobante },
      FeDetReq: { FECAEDetRequest: [feDet] },
    });

    const aprobado = resultado.resultado === 'A';
    const caeVencimiento = resultado.caeFchVto ? yyyymmddToIso(resultado.caeFchVto) : null;
    const codigoBarras = aprobado && resultado.cae
      ? buildCodigoBarras(cuit, receptor.tipoComprobante, puntoVenta.numero, resultado.cae, resultado.caeFchVto)
      : null;

    const snapshot = {
      empresa: {
        razonSocial: empresa.razonSocial || empresa.nombre,
        domicilio: empresa.direccion || '',
        condicionIva: empresa.condicionIva || '',
        cuit: empresa.cuit,
        iibb: empresa.iibb || '',
        fechaInicioActividades: empresa.fechaInicioActividades || '',
      },
      cliente: cliente
        ? {
            nombre: cliente.nombre,
            cuit: cliente.cuit || '',
            docTipo: receptor.docTipo,
            docNro: receptor.docNro,
            condicionIva: cliente.condicionIva || '',
            domicilio: cliente.domicilio || '',
          }
        : { nombre: 'Consumidor Final', cuit: '', docTipo: 99, docNro: 0, condicionIva: 'Consumidor Final', domicilio: '' },
      puntoVenta: puntoVenta.numero,
      tipoComprobante: receptor.tipoComprobante,
      tipoPago: venta.tipoPago || '',
      fechaEmision: cbteFch,
      detalle: {
        items: desglose.items,
        netoGravado: round2(desglose.netoGravado),
        impIVA: round2(desglose.impIVA),
        impTotal: round2(desglose.impTotal),
        ivaPorAlicuota: desglose.ivaPorAlicuota,
      },
    };

    const comprobante = this.comprobanteRepository.create({
      idEmpresa,
      idVenta,
      tipoComprobante: receptor.tipoComprobante,
      puntoVenta: puntoVenta.numero,
      nroComprobante: resultado.cbteDesde,
      cae: resultado.cae || null,
      caeVencimiento,
      estado: aprobado ? EstadoComprobante.APROBADO : EstadoComprobante.RECHAZADO,
      codigoBarras,
      mensajeError: aprobado ? null : this.formatearObservaciones(resultado.observaciones),
      snapshot,
    });

    await this.ventaRepository.save(venta);
    await this.comprobanteRepository.save(comprobante);

    return comprobante;
  }

  async getComprobante(idVenta: number, idEmpresa: number) {
    const venta = await this.ventaRepository.findOne({ where: { id: idVenta, idEmpresa } });
    if (!venta) throw new NotFoundException(`Venta ${idVenta} no encontrada`);
    return this.comprobanteRepository.findOne({ where: { idVenta } });
  }

  /**
   * Publica el PDF del comprobante (original) en Spaces y devuelve su URL
   * pública para compartir (p. ej. por WhatsApp). Idempotente.
   */
  async obtenerPdfUrl(idVenta: number, idEmpresa: number): Promise<{ url: string }> {
    const venta = await this.ventaRepository.findOne({ where: { id: idVenta, idEmpresa } });
    if (!venta) throw new NotFoundException(`Venta ${idVenta} no encontrada`);
    const comprobante = await this.comprobanteRepository.findOne({ where: { idVenta } });
    if (!comprobante) throw new NotFoundException('La venta no tiene comprobante');
    if (comprobante.estado !== EstadoComprobante.APROBADO) {
      throw new BadRequestException('El comprobante no está aprobado por ARCA');
    }

    const buffer = await this.pdfService.generar(comprobante, CopiaComprobante.ORIGINAL);
    const letra = letraTipoComprobante(comprobante.tipoComprobante);
    const nombre = `Factura-${letra}-${String(comprobante.puntoVenta).padStart(5, '0')}-${String(comprobante.nroComprobante).padStart(8, '0')}.pdf`;
    const url = await this.spacesService.subirFacturaPdf(idEmpresa, nombre, buffer);
    return { url };
  }

  /** Desglosa neto + IVA de los ítems de la venta según precioConIva/alicuotaIva congelados. */
  desglosarIva(movimientos: MovimientoProducto[]): DesgloseIva {
    const items: ItemFiscal[] = movimientos.map(m => {
      const cantidad = Math.abs(Number(m.cantidad));
      const precioUnitario = Number(m.precio);
      const alicuotaIva = Number(m.alicuotaIva || 0);
      const totalCargado = cantidad * precioUnitario;

      let subtotalNeto: number;
      let subtotalConIva: number;
      if (m.precioConIva && alicuotaIva > 0) {
        subtotalNeto = totalCargado / (1 + alicuotaIva / 100);
        subtotalConIva = totalCargado;
      } else {
        subtotalNeto = totalCargado;
        subtotalConIva = totalCargado * (1 + alicuotaIva / 100);
      }

      return {
        codigo: m.producto?.codigo || '',
        descripcion: m.producto?.nombre || `Producto #${m.idProducto}`,
        cantidad,
        precioUnitarioNeto: subtotalNeto / cantidad,
        alicuotaIva,
        subtotalNeto,
        subtotalConIva,
      };
    });

    const netoGravado = items.reduce((acc, i) => acc + i.subtotalNeto, 0);
    const impTotal = items.reduce((acc, i) => acc + i.subtotalConIva, 0);
    const impIVA = impTotal - netoGravado;

    const porAlicuota = new Map<number, { baseImp: number; importe: number }>();
    for (const item of items) {
      const alic = item.alicuotaIva;
      const importeIva = item.subtotalConIva - item.subtotalNeto;
      const actual = porAlicuota.get(alic) || { baseImp: 0, importe: 0 };
      actual.baseImp += item.subtotalNeto;
      actual.importe += importeIva;
      porAlicuota.set(alic, actual);
    }

    const ivaPorAlicuota = Array.from(porAlicuota.entries())
      .filter(([, v]) => Math.abs(v.importe) > 0.005)
      .map(([alicuota, v]) => ({
        id: IVA_ALICUOTA_IDS[String(Number(alicuota))] ?? IVA_ALICUOTA_IDS['21'],
        alicuota,
        baseImp: round2(v.baseImp),
        importe: round2(v.importe),
      }));

    return {
      items,
      netoGravado: round2(netoGravado),
      impIVA: round2(impIVA),
      impTotal: round2(impTotal),
      ivaPorAlicuota,
    };
  }

  private async resolverPuntoVenta(venta: Venta, idEmpresa: number): Promise<PuntoVenta> {
    if (venta.cajaPuesto?.idPuntoVenta) {
      const pv = await this.puntoVentaRepository.findOne({
        where: { id: venta.cajaPuesto.idPuntoVenta, idEmpresa },
      });
      if (pv) return pv;
    }
    const predeterminado = await this.puntoVentaRepository.findOne({
      where: { idEmpresa, predeterminado: true },
    });
    if (predeterminado) return predeterminado;
    const primero = await this.puntoVentaRepository.findOne({
      where: { idEmpresa },
      order: { id: 'ASC' },
    });
    if (!primero) throw new BadRequestException('No hay un punto de venta configurado para la empresa');
    return primero;
  }

  private resolverReceptor(cliente: Cliente | null): {
    docTipo: number;
    docNro: number;
    condicionIvaId: number;
    tipoComprobante: number;
  } {
    if (!cliente || !cliente.cuit) {
      return {
        docTipo: 99,
        docNro: 0,
        condicionIvaId: CONDICION_IVA_IDS['Consumidor Final'],
        tipoComprobante: TipoComprobanteArca.FACTURA_B,
      };
    }
    const docNro = Number(cliente.cuit.replace(/\D/g, '') || '0');
    const condicion = cliente.condicionIva || '';

    if (condicion === 'IVA Responsable Inscripto') {
      return { docTipo: 80, docNro, condicionIvaId: 1, tipoComprobante: TipoComprobanteArca.FACTURA_A };
    }
    if (condicion === 'IVA Sujeto Exento' || condicion === 'IVA No Alcanzado') {
      return {
        docTipo: 80,
        docNro,
        condicionIvaId: CONDICION_IVA_IDS[condicion],
        tipoComprobante: TipoComprobanteArca.FACTURA_C,
      };
    }
    return {
      docTipo: 80,
      docNro,
      condicionIvaId: CONDICION_IVA_IDS[condicion] ?? CONDICION_IVA_IDS['Responsable Monotributo'],
      tipoComprobante: TipoComprobanteArca.FACTURA_B,
    };
  }

  private formatearObservaciones(obs?: { Obs: { Code: number; Msg: string }[] }): string | null {
    if (!obs?.Obs?.length) return null;
    return obs.Obs.map(o => `${o.Code}: ${o.Msg}`).join(' | ');
  }
}
