import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';
import { Producto } from './producto.entity';
import { Almacen } from './almacen.entity';
import { Empresa } from './empresa.entity';

@Entity('stock_producto')
@Unique(['idProducto', 'idAlmacen', 'idEmpresa'])
export class StockProducto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'id_producto' })
    idProducto: number;

    @ManyToOne(() => Producto, (producto) => producto.id)
    @JoinColumn({ name: 'id_producto' })
    producto: Producto;

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

    @Column({ name: 'stock_actual', type: 'decimal', precision: 10, scale: 2, default: 0 })
    stockActual: number;

    @Column({ name: 'stock_minimo', type: 'decimal', precision: 10, scale: 2, default: 0 })
    stockMinimo: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
