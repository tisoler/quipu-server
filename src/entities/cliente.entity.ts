import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('cliente')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_empresa' })
  idEmpresa: number;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column()
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuit: string | null;

  @Column({ name: 'condicion_iva', type: 'varchar', length: 100, nullable: true })
  condicionIva: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domicilio: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
