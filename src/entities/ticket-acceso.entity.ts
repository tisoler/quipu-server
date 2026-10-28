import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Empresa } from './empresa.entity';
import { EntornoArca } from './credenciales-arca.entity';

@Entity('ticket_acceso')
@Unique(['idEmpresa', 'entorno'])
export class TicketAcceso {
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
  token: string;

  @Column({ type: 'text' })
  sign: string;

  @Column({ type: 'timestamp' })
  expiracion: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
