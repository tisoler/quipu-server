import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Producto } from './producto.entity';
import { Material } from './material.entity';
import { Almacen } from './almacen.entity';

@Entity('empresa')
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  localidad: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ unique: true })
  cuit: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 255, nullable: true })
  razonSocial: string | null;

  @Column({ name: 'condicion_iva', type: 'varchar', length: 100, default: 'IVA Responsable Inscripto' })
  condicionIva: string;

  @Column({ name: 'fecha_inicio_actividades', type: 'date', nullable: true })
  fechaInicioActividades: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  iibb: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Producto, (producto) => producto.empresa)
  productos: Producto[];

  @OneToMany(() => Material, (material) => material.empresa)
  materiales: Material[];

  @OneToMany(() => Almacen, (almacen) => almacen.empresa)
  almacenes: Almacen[];
}
