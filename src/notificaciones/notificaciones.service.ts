import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private notificacionRepository: Repository<Notificacion>,
  ) { }

  /** Notificaciones de la empresa con contador de no leídas. */
  async findAll(empresaId: number) {
    const [notificaciones, noLeidas] = await Promise.all([
      this.notificacionRepository.find({
        where: { idEmpresa: empresaId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.notificacionRepository.count({
        where: { idEmpresa: empresaId, leida: false },
      }),
    ]);
    return { noLeidas, notificaciones };
  }

  /** Marca una notificación como leída. */
  async marcarLeida(id: number, empresaId: number): Promise<Notificacion> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id, idEmpresa: empresaId },
    });
    if (!notificacion) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }
    notificacion.leida = true;
    return this.notificacionRepository.save(notificacion);
  }
}
