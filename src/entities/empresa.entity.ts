import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.empresa)
  usuarios: Usuario[];

  @OneToMany(() => Producto, (producto) => producto.empresa)
  productos: Producto[];

  @OneToMany(() => Material, (material) => material.empresa)
  materiales: Material[];

  @OneToMany(() => Almacen, (almacen) => almacen.empresa)
  almacenes: Almacen[];
}
