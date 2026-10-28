import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { CajaPuesto, EstadoCaja } from '../entities/caja-puesto.entity';
import { CajaCentral, TipoMovimientoCajaCentral } from '../entities/caja-central.entity';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { Venta } from '../entities/venta.entity';
import { Notificacion, TipoNotificacion } from '../entities/notificacion.entity';
import { Producto, EstadoProducto } from '../entities/producto.entity';
import { StockProducto } from '../entities/stock-producto.entity';
import { Almacen } from '../entities/almacen.entity';
import { TipoMovimiento, EstadoMovimiento } from '../entities/movimiento.types';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { RegistrarVentasDto } from './dto/registrar-ventas.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { FilterCajaDto } from './dto/filter-caja.dto';

@Injectable()
export class PuestosService {
  constructor(
    @InjectRepository(CajaPuesto)
    private cajaRepository: Repository<CajaPuesto>,
    @InjectRepository(CajaCentral)
    private cajaCentralRepository: Repository<CajaCentral>,
    @InjectRepository(MovimientoProducto)
    private movimientoRepository: Repository<MovimientoProducto>,
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(StockProducto)
    private stockRepository: Repository<StockProducto>,
    @InjectRepository(Almacen)
    private almacenRepository: Repository<Almacen>,
  ) { }

  /** Caja actual del vendedor: la abierta, o la última cerrada (para mostrar resumen). */
  async miCaja(idUsuario: string, idEmpresa: number) {
    let caja = await this.cajaRepository.findOne({
      where: { idUsuario, idEmpresa, estado: EstadoCaja.ABIERTA },
      relations: ['almacen'],
      order: { fechaApertura: 'DESC' },
    });

    if (!caja) {
      caja = await this.cajaRepository.findOne({
        where: { idUsuario, idEmpresa },
        relations: ['almacen'],
        order: { fechaApertura: 'DESC' },
      });
    }

    if (!caja) return { caja: null, ventas: [], totalVendido: 0 };

    const ventas = await this.ventasDeCaja(caja.id);
    const totalVendido = ventas.reduce((acc, v) => acc + Math.abs(Number(v.total)), 0);
    return { caja, ventas, totalVendido };
  }

  private async ventasDeCaja(idCaja: number): Promise<MovimientoProducto[]> {
    return this.movimientoRepository.find({
      where: { idCajaPuesto: idCaja, estado: EstadoMovimiento.ACTIVO, tipoMovimiento: TipoMovimiento.VENTA },
      relations: ['producto'],
      order: { fecha: 'DESC' },
    });
  }

  /** Abre una caja nueva para el día. Idempotente si ya hay una abierta. */
  async abrirCaja(dto: AbrirCajaDto, idUsuario: string, nombreUsuario: string, idEmpresa: number) {
    const abierta = await this.cajaRepository.findOne({
      where: { idUsuario, idEmpresa, estado: EstadoCaja.ABIERTA },
      relations: ['almacen'],
    });
    if (abierta) return abierta;

    // Si el vendedor ya cerró una caja hoy, no puede abrir otra (solo admin puede reabrir)
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);
    const cerradaHoy = await this.cajaRepository.findOne({
      where: {
        idUsuario,
        idEmpresa,
        estado: EstadoCaja.CERRADA,
        fechaCierre: MoreThanOrEqual(inicioDelDia),
      },
    });
    if (cerradaHoy) {
      throw new ConflictException(
        'Ya cerraste una caja hoy. Un administrador debe rehabilitarla para volver a vender.',
      );
    }

    const almacen = await this.almacenRepository.findOne({ where: { id: dto.idAlmacen, idEmpresa } });
    if (!almacen) throw new BadRequestException(`Almacén ${dto.idAlmacen} no encontrado`);

    const caja = this.cajaRepository.create({
      idEmpresa,
      idUsuario,
      nombreUsuario,
      idAlmacen: dto.idAlmacen,
      fechaApertura: new Date(),
      estado: EstadoCaja.ABIERTA,
      totalVendido: 0,
      idPuntoVenta: almacen.idPuntoVenta ?? null,
    });
    const saved = await this.cajaRepository.save(caja);
    saved.almacen = almacen;
    return saved;
  }

  /** Productos con stock del puesto y stock general, para buscar desde el POS. */
  async buscarProductos(idCaja: number, search: string | undefined, idUsuario: string, idEmpresa: number) {
    const caja = await this.cajaPropia(idCaja, idUsuario, idEmpresa);

    const qb = this.productoRepository.createQueryBuilder('producto')
      .leftJoin('producto.proveedor', 'proveedor')
      .where('producto.idEmpresa = :idEmpresa', { idEmpresa })
      .andWhere('producto.estado = :estado', { estado: EstadoProducto.ACTIVO });

    if (search) {
      qb.andWhere(
        '(producto.nombre ILIKE :search OR producto.codigo ILIKE :search OR producto.presentacion ILIKE :search OR producto.descripcion ILIKE :search OR producto.talle ILIKE :search OR producto.color ILIKE :search OR proveedor.nombre ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const productos = await qb.orderBy('producto.nombre').take(50).getMany();
    if (productos.length === 0) return [];

    const ids = productos.map(p => p.id);
    const stocks = await this.stockRepository.find({
      where: { idProducto: In(ids), idEmpresa },
    });

    return productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      presentacion: p.presentacion,
      talle: p.talle,
      color: p.color,
      precio: Number(p.precio),
      precioConIva: p.precioConIva,
      alicuotaIva: Number(p.alicuotaIva),
      stockPuesto: stocks
        .filter(s => s.idProducto === p.id && s.idAlmacen === caja.idAlmacen)
        .reduce((acc, s) => acc + Number(s.stockActual), 0),
      stockGeneral: stocks
        .filter(s => s.idProducto === p.id)
        .reduce((acc, s) => acc + Number(s.stockActual), 0),
    }));
  }

  /** Registra las ventas del carrito: un movimiento por ítem, descontando stock. */
  async registrarVentas(idCaja: number, dto: RegistrarVentasDto, idUsuario: string, nombreUsuario: string, idEmpresa: number) {
    const caja = await this.cajaPropia(idCaja, idUsuario, idEmpresa);
    if (caja.estado !== EstadoCaja.ABIERTA) {
      throw new BadRequestException('La caja está cerrada');
    }

    const queryRunner = this.cajaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const venta = queryRunner.manager.create(Venta, {
        idEmpresa,
        idCajaPuesto: caja.id,
        tipoPago: dto.tipoPago,
        total: 0,
        fecha: new Date(),
      });
      const ventaGuardada = await queryRunner.manager.save(venta);

      const movimientos: MovimientoProducto[] = [];
      let totalVenta = 0;

      for (const item of dto.items) {
        const producto = await queryRunner.manager.findOne(Producto, {
          where: { id: item.idProducto, idEmpresa },
        });
        if (!producto) throw new BadRequestException(`Producto ${item.idProducto} no encontrado`);

        const precio = item.precio != null ? item.precio : Number(producto.precio);
        totalVenta += item.cantidad * precio;

        const stock = await queryRunner.manager.findOne(StockProducto, {
          where: { idProducto: producto.id, idAlmacen: caja.idAlmacen, idEmpresa },
        });
        const disponible = stock ? Number(stock.stockActual) : 0;
        if (disponible < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para "${producto.nombre}": disponible ${disponible}, solicitado ${item.cantidad}`,
          );
        }

        // Venta: cantidad y total negativos (convención de salida, igual que transferencias)
        const movimiento = queryRunner.manager.create(MovimientoProducto, {
          idProducto: producto.id,
          idAlmacen: caja.idAlmacen,
          tipoMovimiento: TipoMovimiento.VENTA,
          cantidad: -item.cantidad,
          precio,
          total: -(item.cantidad * precio),
          descripcion: 'Venta en puesto',
          idEmpresa,
          idUsuario,
          nombreUsuario,
          fecha: new Date(),
          estado: EstadoMovimiento.ACTIVO,
          idCajaPuesto: caja.id,
          tipoPago: dto.tipoPago,
          idVenta: ventaGuardada.id,
          precioConIva: producto.precioConIva,
          alicuotaIva: Number(producto.alicuotaIva),
        });
        movimientos.push(await queryRunner.manager.save(movimiento));

        stock.stockActual = disponible - item.cantidad;
        await queryRunner.manager.save(stock);
      }

      ventaGuardada.total = totalVenta;
      await queryRunner.manager.save(ventaGuardada);

      await queryRunner.commitTransaction();

      for (const m of movimientos) {
        m.producto = await this.productoRepository.findOne({ where: { id: m.idProducto } });
      }
      return { venta: ventaGuardada, movimientos };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Anula una venta de la propia caja abierta, reponiendo el stock. */
  async anularVenta(idMovimiento: number, idUsuario: string, idEmpresa: number) {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id: idMovimiento, idEmpresa, estado: EstadoMovimiento.ACTIVO },
    });
    if (!movimiento) throw new NotFoundException('Venta no encontrada');
    if (!movimiento.idCajaPuesto) throw new BadRequestException('La venta no pertenece a un puesto');

    const caja = await this.cajaPropia(movimiento.idCajaPuesto, idUsuario, idEmpresa);
    if (caja.estado !== EstadoCaja.ABIERTA) {
      throw new BadRequestException('La caja está cerrada');
    }

    return await this.movimientoRepository.manager.transaction(async (manager) => {
      movimiento.estado = EstadoMovimiento.ELIMINADO;
      const saved = await manager.save(movimiento);

      // La cantidad de la venta es negativa: reponer stock sumando el inverso
      const repone = Math.abs(Number(movimiento.cantidad));
      const stock = await manager.findOne(StockProducto, {
        where: { idProducto: movimiento.idProducto, idAlmacen: movimiento.idAlmacen, idEmpresa },
      });
      if (stock) {
        stock.stockActual = Number(stock.stockActual) + repone;
        await manager.save(stock);
      } else {
        const nuevo = manager.create(StockProducto, {
          idProducto: movimiento.idProducto,
          idAlmacen: movimiento.idAlmacen,
          stockActual: repone,
          idEmpresa,
        });
        await manager.save(nuevo);
      }

      return saved;
    });
  }

  /** Cierra la caja con arqueo: transfiere el dinero declarado a la caja central. */
  async cerrarCaja(idCaja: number, dto: CerrarCajaDto, idUsuario: string, nombreUsuario: string, idEmpresa: number) {
    const caja = await this.cajaPropia(idCaja, idUsuario, idEmpresa);
    if (caja.estado !== EstadoCaja.ABIERTA) {
      throw new BadRequestException('La caja ya está cerrada');
    }

    const queryRunner = this.cajaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Totales por medio de pago sobre las ventas activas de la caja
      const filas = await queryRunner.manager
        .createQueryBuilder(MovimientoProducto, 'movimiento')
        .select('movimiento.tipo_pago', 'tipoPago')
        .addSelect('COALESCE(SUM(-movimiento.total), 0)', 'total')
        .where('movimiento.idCajaPuesto = :idCaja', { idCaja })
        .andWhere('movimiento.estado = :estado', { estado: EstadoMovimiento.ACTIVO })
        .andWhere('movimiento.tipoMovimiento = :tipo', { tipo: TipoMovimiento.VENTA })
        .groupBy('movimiento.tipo_pago')
        .getRawMany();

      const totalesPorPago: Record<string, number> = {};
      let totalVendido = 0;
      for (const fila of filas) {
        const total = Number(fila.total ?? 0);
        totalVendido += total;
        if (fila.tipoPago) totalesPorPago[fila.tipoPago] = total;
      }

      const declarado = dto.montoDeclarado;
      const faltante = Math.max(totalVendido - declarado, 0);
      const sobrante = Math.max(declarado - totalVendido, 0);
      const hayDiferencia = faltante > 0.005 || sobrante > 0.005;

      // Si la caja no cierra exacta, la observación es obligatoria
      if (hayDiferencia && !dto.observaciones?.trim()) {
        throw new BadRequestException(
          'Hay diferencia entre la caja y lo declarado: indicá una observación.',
        );
      }

      caja.estado = EstadoCaja.CERRADA;
      caja.fechaCierre = new Date();
      caja.totalVendido = totalVendido;
      caja.montoDeclarado = declarado;
      caja.montoTransferido = declarado;
      caja.faltante = faltante;
      caja.sobrante = sobrante;
      caja.observaciones = dto.observaciones || null;
      caja.totalesPorPago = totalesPorPago;
      await queryRunner.manager.save(caja);

      // El dinero físico declarado ingresa a la caja central
      const ingreso = queryRunner.manager.create(CajaCentral, {
        idEmpresa,
        fecha: new Date(),
        tipo: TipoMovimientoCajaCentral.INGRESO_CIERRE,
        monto: declarado,
        idCajaPuesto: caja.id,
        idUsuario,
        nombreUsuario,
        descripcion: `Cierre de caja #${caja.id} (${nombreUsuario})`,
      });
      await queryRunner.manager.save(ingreso);

      // Avisar a los administradores si hubo faltante o sobrante
      if (hayDiferencia) {
        const detalle = faltante > 0.005
          ? `Faltante de $ ${faltante.toFixed(2)}`
          : `Sobrante de $ ${sobrante.toFixed(2)}`;
        const notificacion = queryRunner.manager.create(Notificacion, {
          idEmpresa,
          tipo: TipoNotificacion.CAJA_DIFERENCIA,
          titulo: `Diferencia en cierre de caja #${caja.id}`,
          mensaje: `${detalle} — vendedor ${nombreUsuario}. Declarado $ ${declarado.toFixed(2)} vs sistema $ ${totalVendido.toFixed(2)}.`,
          idCajaPuesto: caja.id,
          leida: false,
        });
        await queryRunner.manager.save(notificacion);
      }

      await queryRunner.commitTransaction();
      return caja;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Listado de cajas para administración. */
  async findAllCajas(filters: FilterCajaDto, idEmpresa: number) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const qb = this.cajaRepository.createQueryBuilder('caja')
      .leftJoinAndSelect('caja.almacen', 'almacen')
      .where('caja.idEmpresa = :idEmpresa', { idEmpresa });

    if (filters.estado) {
      qb.andWhere('caja.estado = :estado', { estado: filters.estado });
    }
    if (filters.fechaDesde) {
      qb.andWhere('caja.fechaApertura >= :desde', { desde: filters.fechaDesde });
    }
    if (filters.fechaHasta) {
      const dateString = filters.fechaHasta.toString().split('T')[0];
      qb.andWhere('caja.fechaApertura <= :hasta', { hasta: `${dateString}T23:59:59.999` });
    }

    qb.orderBy('caja.fechaApertura', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Detalle de una caja con sus ventas. La ve su dueño o un perfil con lectura de caja central. */
  async findOneCaja(id: number, idEmpresa: number, usuario: { id: string; permisos: string[] }) {
    const caja = await this.cajaRepository.findOne({
      where: { id, idEmpresa },
      relations: ['almacen'],
    });
    if (!caja) throw new NotFoundException(`Caja ${id} no encontrada`);

    const esDueno = caja.idUsuario === usuario.id;
    const esAdmin = usuario.permisos?.includes('lectura:caja-central');
    if (!esDueno && !esAdmin) {
      throw new ForbiddenException('No tiene acceso a esta caja');
    }

    const ventas = await this.ventasDeCaja(id);
    return { caja, ventas };
  }

  /** Rehabilita una caja cerrada: revierte la transferencia a la caja central. Solo admin. */
  async reabrirCaja(id: number, idEmpresa: number) {
    const caja = await this.cajaRepository.findOne({ where: { id, idEmpresa } });
    if (!caja) throw new NotFoundException(`Caja ${id} no encontrada`);
    if (caja.estado !== EstadoCaja.CERRADA) {
      throw new BadRequestException('La caja no está cerrada');
    }

    return await this.cajaRepository.manager.transaction(async (manager) => {
      // Revertir el ingreso transferido a la caja central
      await manager.delete(CajaCentral, { idCajaPuesto: caja.id });

      caja.estado = EstadoCaja.ABIERTA;
      caja.fechaCierre = null;
      caja.totalVendido = 0;
      caja.montoDeclarado = null;
      caja.montoTransferido = null;
      caja.faltante = null;
      caja.sobrante = null;
      caja.observaciones = null;
      caja.totalesPorPago = null;
      return manager.save(caja);
    });
  }

  /** Saldo y movimientos de la caja central. */
  async cajaCentral(idEmpresa: number) {
    const resultado = await this.cajaCentralRepository
      .createQueryBuilder('movimiento')
      .select('COALESCE(SUM(movimiento.monto), 0)', 'saldo')
      .where('movimiento.idEmpresa = :idEmpresa', { idEmpresa })
      .getRawOne();

    const movimientos = await this.cajaCentralRepository.find({
      where: { idEmpresa },
      order: { fecha: 'DESC' },
      take: 100,
    });

    return { saldo: Number(resultado?.saldo ?? 0), movimientos };
  }

  /** Valida que la caja exista, sea de la empresa y pertenezca al usuario. */
  private async cajaPropia(idCaja: number, idUsuario: string, idEmpresa: number): Promise<CajaPuesto> {
    const caja = await this.cajaRepository.findOne({
      where: { id: idCaja, idEmpresa },
      relations: ['almacen'],
    });
    if (!caja) throw new NotFoundException(`Caja ${idCaja} no encontrada`);
    if (caja.idUsuario !== idUsuario) {
      throw new ForbiddenException('La caja pertenece a otro usuario');
    }
    return caja;
  }
}
