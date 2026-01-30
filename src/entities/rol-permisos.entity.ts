import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';
import { Empresa } from './empresa.entity';

@Entity('rol_permisos')
export class RolPermisos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_rol' })
  idRol: number;

  @Column({ name: 'id_permiso' })
  idPermiso: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @ManyToOne(() => Permiso)
  @JoinColumn({ name: 'id_permiso' })
  permiso: Permiso;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
