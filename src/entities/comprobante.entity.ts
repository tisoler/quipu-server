import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Venta } from './venta.entity';

export enum EstadoComprobante {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

@Entity('comprobante')
export class Comprobante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'id_venta' })
  idVenta: number;

  @ManyToOne(() => Venta)
  @JoinColumn({ name: 'id_venta' })
  venta: Venta;

  @Column({ name: 'tipo_comprobante' })
  tipoComprobante: number;

  @Column({ name: 'punto_venta' })
  puntoVenta: number;

  @Column({ name: 'nro_comprobante' })
  nroComprobante: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cae: string | null;

  @Column({ name: 'cae_vencimiento', type: 'date', nullable: true })
  caeVencimiento: string | null;

  @Column({ type: 'varchar', length: 20, default: EstadoComprobante.PENDIENTE })
  estado: EstadoComprobante;

  @Column({ name: 'codigo_barras', type: 'varchar', length: 64, nullable: true })
  codigoBarras: string | null;

  @Column({ name: 'mensaje_error', type: 'text', nullable: true })
  mensajeError: string | null;

  @Column({ type: 'jsonb', nullable: true })
  snapshot: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
