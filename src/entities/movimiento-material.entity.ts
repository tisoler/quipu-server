import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Almacen } from './almacen.entity';
import { Material } from './material.entity';
import { TipoMovimiento, EstadoMovimiento } from './movimiento.types';

@Entity('movimiento_material')
export class MovimientoMaterial {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @Column({ name: 'id_material' })
    idMaterial: number;

    @ManyToOne(() => Material)
    @JoinColumn({ name: 'id_material' })
    material: Material;

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
    idUsuario: string;

    @Column({ name: 'nombre_usuario', nullable: true })
    nombreUsuario: string;

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
