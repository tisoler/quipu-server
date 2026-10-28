import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { Almacen } from './almacen.entity';
import { Producto } from './producto.entity';
import { CajaPuesto } from './caja-puesto.entity';
import { Venta } from './venta.entity';
import { TipoMovimiento, EstadoMovimiento, TipoPago } from './movimiento.types';

@Entity('movimiento_producto')
export class MovimientoProducto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @Column({ name: 'id_producto' })
    idProducto: number;

    @ManyToOne(() => Producto)
    @JoinColumn({ name: 'id_producto' })
    producto: Producto;

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

    @Column({ name: 'id_caja_puesto', nullable: true })
    idCajaPuesto: number | null;

    @ManyToOne(() => CajaPuesto)
    @JoinColumn({ name: 'id_caja_puesto' })
    cajaPuesto: CajaPuesto | null;

  @Column({ name: 'tipo_pago', type: 'varchar', length: 20, nullable: true })
  tipoPago: TipoPago | null;

  @Column({ name: 'id_venta', nullable: true })
  idVenta: number | null;

  @ManyToOne(() => Venta, (venta) => venta.movimientos)
  @JoinColumn({ name: 'id_venta' })
  venta: Venta | null;

  @Column({ name: 'precio_con_iva', default: false })
  precioConIva: boolean;

  @Column({ name: 'alicuota_iva', type: 'decimal', precision: 5, scale: 2, default: 21 })
  alicuotaIva: number;

  @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
