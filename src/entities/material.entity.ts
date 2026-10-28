import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Proveedor } from './proveedor.entity';

export enum EstadoMaterial {
  ACTIVO = 'activo',
  NO_ACTIVO = 'no-activo',
}

@Entity('material')
export class Material {
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
    default: EstadoMaterial.ACTIVO,
  })
  estado: EstadoMaterial;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'stock_minimo', default: 0 })
  stockMinimo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precio: number;

  @Column({ name: 'id_proveedor', nullable: true })
  idProveedor: number | null;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: Proveedor | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
