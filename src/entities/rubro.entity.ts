import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Producto } from './producto.entity';

@Entity('rubro')
export class Rubro {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ name: 'id_empresa' })
    idEmpresa: number;

    @ManyToOne(() => Empresa)
    @JoinColumn({ name: 'id_empresa' })
    empresa: Empresa;

    @ManyToMany(() => Producto, (producto) => producto.rubros)
    productos: Producto[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
