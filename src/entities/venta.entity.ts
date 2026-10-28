import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Empresa } from './empresa.entity';
import { CajaPuesto } from './caja-puesto.entity';
import { Cliente } from './cliente.entity';
import { MovimientoProducto } from './movimiento-producto.entity';
import { TipoPago } from './movimiento.types';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'id_caja_puesto' })
  idCajaPuesto: number;

  @ManyToOne(() => CajaPuesto)
  @JoinColumn({ name: 'id_caja_puesto' })
  cajaPuesto: CajaPuesto;

  @Column({ name: 'id_cliente', nullable: true })
  idCliente: number | null;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente | null;

  @Column({ name: 'tipo_pago', type: 'varchar', length: 20, nullable: true })
  tipoPago: TipoPago | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @OneToMany(() => MovimientoProducto, (movimiento) => movimiento.venta)
  movimientos: MovimientoProducto[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
