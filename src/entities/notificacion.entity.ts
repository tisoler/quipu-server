import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { CajaPuesto } from './caja-puesto.entity';

export enum TipoNotificacion {
  CAJA_DIFERENCIA = 'caja-diferencia',
}

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50 })
  tipo: TipoNotificacion;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  mensaje: string | null;

  @Column({ name: 'id_caja_puesto', nullable: true })
  idCajaPuesto: number | null;

  @ManyToOne(() => CajaPuesto)
  @JoinColumn({ name: 'id_caja_puesto' })
  cajaPuesto: CajaPuesto | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
