import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Almacen } from './almacen.entity';
import { TipoArticulo } from './movimiento.entity';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ name: 'id_articulo' })
  idArticulo: number;

  @Column({
    name: 'tipo_articulo',
    type: 'varchar',
    length: 20,
  })
  tipoArticulo: TipoArticulo;

  @Column({ name: 'id_almacen', nullable: true })
  idAlmacen: number | null;

  @ManyToOne(() => Almacen, { nullable: true })
  @JoinColumn({ name: 'id_almacen' })
  almacen: Almacen | null;

  @Column({ name: 'stock_articulo', type: 'decimal', precision: 10, scale: 2, default: 0 })
  stockArticulo: number;

  @Column({ name: 'stock_almacen', type: 'decimal', precision: 10, scale: 2, default: 0 })
  stockAlmacen: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
