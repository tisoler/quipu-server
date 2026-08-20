import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Rubro } from './rubro.entity';

export enum EstadoProducto {
  ACTIVO = 'activo',
  NO_ACTIVO = 'no-activo',
}

@Entity('producto')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  presentacion: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoProducto.ACTIVO,
  })
  estado: EstadoProducto;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'stock_minimo', default: 0 })
  stockMinimo: number;

  @Column({ name: 'tipo_producto', type: 'varchar', length: 1, nullable: true })
  tipoProducto: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precio: number;

  @ManyToMany(() => Rubro, (rubro) => rubro.productos)
  @JoinTable({
    name: 'rubro_producto',
    joinColumn: { name: 'id_producto', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_rubro', referencedColumnName: 'id' }
  })
  rubros: Rubro[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
