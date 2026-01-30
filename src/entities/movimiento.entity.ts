import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Almacen } from './almacen.entity';
import { Usuario } from './usuario.entity';

export enum TipoMovimiento {
  VENTA = 'venta',
  COMPRA = 'compra',
  CONSUMO = 'consumo',
  PRODUCCION = 'produccion',
}

export enum TipoArticulo {
  PRODUCTO = 'producto',
  MATERIAL = 'material',
}

export enum EstadoMovimiento {
  ACTIVO = 'activo',
  ELIMINADO = 'eliminado',
}

@Entity('movimiento')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ name: 'id_articulo' })
  idArticulo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    name: 'tipo_movimiento',
    type: 'varchar',
    length: 20,
  })
  tipoMovimiento: TipoMovimiento;

  @Column({
    name: 'tipo_articulo',
    type: 'varchar',
    length: 20,
  })
  tipoArticulo: TipoArticulo;

  @Column({ name: 'id_almacen' })
  idAlmacen: number;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'id_almacen' })
  almacen: Almacen;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoMovimiento.ACTIVO,
  })
  estado: EstadoMovimiento;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'stock_actual_articulo', type: 'decimal', precision: 10, scale: 2, default: 0 })
  stockActualArticulo: number;

  @Column({ name: 'stock_actual_almacen', type: 'decimal', precision: 10, scale: 2, default: 0 })
  stockActualAlmacen: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
