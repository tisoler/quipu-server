import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';

export enum EntornoArca {
  HOMOLOGACION = 'homologacion',
  PRODUCCION = 'produccion',
}

@Entity('credenciales_arca')
export class CredencialesArca {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 20 })
  entorno: EntornoArca;

  @Column({ type: 'text' })
  certificado: string;

  @Column({ name: 'clave_privada_cifrada', type: 'text' })
  clavePrivadaCifrada: string;

  @Column({ type: 'date', nullable: true })
  vencimiento: string | null;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
