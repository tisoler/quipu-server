import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { CajaPuesto } from './caja-puesto.entity';

export enum TipoMovimientoCajaCentral {
  INGRESO_CIERRE = 'ingreso-cierre',
}

@Entity('caja_central')
export class CajaCentral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoMovimientoCajaCentral;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'id_caja_puesto', nullable: true })
  idCajaPuesto: number | null;

  @ManyToOne(() => CajaPuesto)
  @JoinColumn({ name: 'id_caja_puesto' })
  cajaPuesto: CajaPuesto | null;

  @Column({ name: 'id_usuario', type: 'varchar', length: 64 })
  idUsuario: string;

  @Column({ name: 'nombre_usuario', type: 'varchar', length: 255, nullable: true })
  nombreUsuario: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
