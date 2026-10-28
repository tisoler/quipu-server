import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Almacen } from './almacen.entity';

export enum EstadoCaja {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

@Entity('caja_puesto')
export class CajaPuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'id_usuario', type: 'varchar', length: 64 })
  idUsuario: string;

  @Column({ name: 'nombre_usuario', type: 'varchar', length: 255, nullable: true })
  nombreUsuario: string;

  @Column({ name: 'id_almacen' })
  idAlmacen: number;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'id_almacen' })
  almacen: Almacen;

  @Column({ name: 'fecha_apertura', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaApertura: Date;

  @Column({ name: 'fecha_cierre', type: 'timestamp', nullable: true })
  fechaCierre: Date | null;

  @Column({ type: 'varchar', length: 20, default: EstadoCaja.ABIERTA })
  estado: EstadoCaja;

  @Column({ name: 'total_vendido', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalVendido: number;

  @Column({ name: 'monto_declarado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoDeclarado: number | null;

  @Column({ name: 'monto_transferido', type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoTransferido: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  faltante: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sobrante: number | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'totales_por_pago', type: 'jsonb', nullable: true })
  totalesPorPago: Record<string, number> | null;

  @Column({ name: 'id_punto_venta', nullable: true })
  idPuntoVenta: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
