import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAcceso } from '../entities/ticket-acceso.entity';
import { EntornoArca } from '../entities/credenciales-arca.entity';
import { WsaaService, TicketAccesoArca } from './wsaa.service';

/**
 * Obtiene y cachea el Ticket de Acceso (TA) en la base de datos.
 * ARCA rechaza un login nuevo mientras haya un TA vigente
 * ("alreadyAuthenticated"), por eso el TA se reutiliza hasta su
 * vencimiento (con 10 minutos de margen) y sobrevive reinicios.
 */
@Injectable()
export class TicketAccesoService {
  constructor(
    @InjectRepository(TicketAcceso)
    private ticketRepository: Repository<TicketAcceso>,
    private wsaaService: WsaaService,
  ) { }

  async obtenerTicket(
    idEmpresa: number,
    entorno: EntornoArca,
    cuit: string,
    certificado: string,
    clavePrivada: string,
  ): Promise<TicketAccesoArca> {
    const margen = new Date(Date.now() + 10 * 60 * 1000);
    const vigente = await this.ticketRepository.findOne({ where: { idEmpresa, entorno } });
    if (vigente && new Date(vigente.expiracion) > margen) {
      return {
        token: vigente.token,
        sign: vigente.sign,
        expirationTime: new Date(vigente.expiracion).toISOString(),
      };
    }

    let ta: TicketAccesoArca;
    try {
      ta = await this.wsaaService.login(entorno, cuit, certificado, clavePrivada);
    } catch (e: any) {
      if (String(e?.message || '').includes('alreadyAuthenticated')) {
        throw new BadRequestException(
          'ARCA indica que ya existe un ticket válido generado recientemente. Reintentá en unos minutos.',
        );
      }
      throw e;
    }

    const expiracion = new Date(ta.expirationTime);
    if (vigente) {
      vigente.token = ta.token;
      vigente.sign = ta.sign;
      vigente.expiracion = expiracion;
      await this.ticketRepository.save(vigente);
    } else {
      await this.ticketRepository.save(
        this.ticketRepository.create({ idEmpresa, entorno, token: ta.token, sign: ta.sign, expiracion }),
      );
    }
    return ta;
  }
}
