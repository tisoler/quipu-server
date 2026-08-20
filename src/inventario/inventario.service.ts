import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { MovimientoMaterial } from '../entities/movimiento-material.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { Almacen } from '../entities/almacen.entity';
import { FilterInventarioDto } from './dto/filter-inventario.dto';
import { AgruparPor } from './dto/filter-inventario.dto';
import { FilterStockActualDto } from './dto/filter-stock-actual.dto';
import { StockProducto } from '../entities/stock-producto.entity';
import { StockMaterial } from '../entities/stock-material.entity';
import { TipoArticulo } from '../entities/movimiento.types';


@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(MovimientoProducto)
    private movimientoProductoRepository: Repository<MovimientoProducto>,
    @InjectRepository(MovimientoMaterial)
    private movimientoMaterialRepository: Repository<MovimientoMaterial>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Almacen)
    private almacenRepository: Repository<Almacen>,
    @InjectRepository(StockProducto)
    private stockProductoRepository: Repository<StockProducto>,
    @InjectRepository(StockMaterial)
    private stockMaterialRepository: Repository<StockMaterial>,
  ) { }


  async getDatosGrafico(filters: FilterInventarioDto, empresaId: number) {
    const {
      tipoArticulo,
      agruparPor = AgruparPor.ARTICULO,
      idArticulos = [],
      idAlmacenes = [],
      fechaDesde,
      fechaHasta,
    } = filters;

    let fHasta = fechaHasta;
    if (fHasta) {
      const dateString = fHasta.toString().split('T')[0];
      fHasta = new Date(`${dateString}T23:59:59.999`) as any;
    }

    let movimientos: any[] = [];

    if (tipoArticulo === TipoArticulo.PRODUCTO || !tipoArticulo) {
      const prodMovs = await this.getMovimientosParaGrafico(
        this.movimientoProductoRepository,
        'idProducto',
        'producto',
        { ...filters, fechaHasta: fHasta },
        empresaId
      );
      movimientos.push(...prodMovs);
    }

    if (tipoArticulo === TipoArticulo.MATERIAL || !tipoArticulo) {
      const matMovs = await this.getMovimientosParaGrafico(
        this.movimientoMaterialRepository,
        'idMaterial',
        'material',
        { ...filters, fechaHasta: fHasta },
        empresaId
      );
      movimientos.push(...matMovs);
    }

    // Si mergeamos, tenemos que re-ordenar por fecha
    movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // El resto de la lógica de articulosInfo se mantiene casi igual

    // Obtener información de artículos y almacenes para las etiquetas
    const articulosInfo = new Map();
    const almacenesInfo = new Map();

    if (idArticulos?.length === 0 && idAlmacenes?.length === 0) {
      return [];
    }

    if (agruparPor === AgruparPor.ARTICULO) {
      const articulosIds = [...new Set(movimientos.map((m) => m.idArticulo))];
      if (articulosIds.length > 0) {
        if (tipoArticulo === 'producto' || !tipoArticulo) {
          const productos = await this.productoRepository.find({
            where: articulosIds.map((id) => ({ id, idEmpresa: empresaId })) as any,
          });
          productos.forEach((p) => {
            articulosInfo.set(p.id, { nombre: p.nombre, stockMinimo: p.stockMinimo });
          });
        }
        if (tipoArticulo === 'material' || !tipoArticulo) {
          const materiales = await this.materialRepository.find({
            where: articulosIds.map((id) => ({ id, idEmpresa: empresaId })) as any,
          });
          materiales.forEach((m) => {
            articulosInfo.set(m.id, { nombre: m.nombre, stockMinimo: m.stockMinimo });
          });
        }
      }
    } else {
      const almacenesIds = [...new Set(movimientos.map((m) => m.idAlmacen).filter((id) => id !== null))];
      if (almacenesIds.length > 0) {
        const almacenes = await this.almacenRepository.find({
          where: almacenesIds.map((id) => ({ id, idEmpresa: empresaId })) as any,
        });
        almacenes.forEach((a) => {
          almacenesInfo.set(a.id, a.nombre);
        });
      }
      // También necesitamos info de artículos para el label
      const articulosIds = [...new Set(movimientos.map((m) => m.idArticulo))];
      if (articulosIds.length > 0) {
        if (tipoArticulo === 'producto' || !tipoArticulo) {
          const productos = await this.productoRepository.find({
            where: articulosIds.map((id) => ({ id, idEmpresa: empresaId })) as any,
          });
          productos.forEach((p) => {
            articulosInfo.set(p.id, { nombre: p.nombre, stockMinimo: p.stockMinimo });
          });
        }
        if (tipoArticulo === 'material' || !tipoArticulo) {
          const materiales = await this.materialRepository.find({
            where: articulosIds.map((id) => ({ id, idEmpresa: empresaId })) as any,
          });
          materiales.forEach((m) => {
            articulosInfo.set(m.id, { nombre: m.nombre, stockMinimo: m.stockMinimo });
          });
        }
      }
    }

    // Formatear datos para el gráfico
    const datos = movimientos.map((m) => {
      const idArt = m.idArticulo || m.idarticulo;
      const tArt = m.tipoArticulo || m.tipoarticulo;
      const idAlm = m.idAlmacen || m.idalmacen || null;
      const stockVal = parseFloat(m.stock || '0');

      return {
        fecha: m.fecha,
        idArticulo: idArt,
        tipoArticulo: tArt,
        idAlmacen: idAlm,
        stock: stockVal,
        label:
          agruparPor === AgruparPor.ARTICULO
            ? articulosInfo.get(idArt)?.nombre || `Artículo ${idArt}`
            : `${articulosInfo.get(idArt)?.nombre || `Artículo ${idArt}`} - ${almacenesInfo.get(idAlm) || 'N/A'}`,
        stockMinimo: agruparPor === AgruparPor.ARTICULO ? articulosInfo.get(idArt)?.stockMinimo || 0 : null,
      };
    });

    return datos;
  }

  private async getMovimientosParaGrafico(
    repository: Repository<any>,
    idField: string,
    tipo: string,
    filters: FilterInventarioDto,
    empresaId: number
  ) {
    const { agruparPor, idArticulos, idAlmacenes, fechaDesde, fechaHasta } = filters;
    const queryBuilder = repository.createQueryBuilder('movimiento')
      .where('movimiento.idEmpresa = :empresaId', { empresaId })
      .andWhere('movimiento.estado = :estado', { estado: 'activo' });

    if (fechaDesde) queryBuilder.andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde });
    if (fechaHasta) queryBuilder.andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta });

    if (agruparPor === AgruparPor.ARTICULO) {
      if (idArticulos && idArticulos.length > 0) {
        queryBuilder.andWhere(`movimiento.${idField} IN (:...idArticulos)`, { idArticulos });
      }
      queryBuilder
        .select([
          'movimiento.fecha as fecha',
          `movimiento.${idField} as idArticulo`,
          `'${tipo}' as tipoArticulo`,
          'MAX(movimiento.stockActualArticulo) as stock',
        ])
        .groupBy('movimiento.fecha')
        .addGroupBy(`movimiento.${idField}`)
        .orderBy('movimiento.fecha', 'ASC');
    } else {
      if (idAlmacenes && idAlmacenes.length > 0) {
        queryBuilder.andWhere('movimiento.idAlmacen IN (:...idAlmacenes)', { idAlmacenes });
      }
      queryBuilder
        .select([
          'movimiento.fecha as fecha',
          `movimiento.${idField} as idArticulo`,
          `'${tipo}' as tipoArticulo`,
          'movimiento.idAlmacen as idAlmacen',
          'MAX(movimiento.stockActualAlmacen) as stock',
        ])
        .groupBy('movimiento.fecha')
        .addGroupBy(`movimiento.${idField}`)
        .addGroupBy('movimiento.idAlmacen')
        .orderBy('movimiento.fecha', 'ASC');
    }

    return queryBuilder.getRawMany();
  }

  async getArticulosDisponibles(tipoArticulo: string | undefined, empresaId: number) {
    const articulos: any[] = [];

    if (tipoArticulo === 'producto' || !tipoArticulo) {
      const productos = await this.productoRepository.find({
        where: { idEmpresa: empresaId },
        select: ['id', 'nombre', 'stockMinimo'],
      });
      articulos.push(...productos.map((p) => ({ ...p, tipoArticulo: 'producto' })));
    }

    if (tipoArticulo === 'material' || !tipoArticulo) {
      const materiales = await this.materialRepository.find({
        where: { idEmpresa: empresaId },
        select: ['id', 'nombre', 'stockMinimo'],
      });
      articulos.push(...materiales.map((m) => ({ ...m, tipoArticulo: 'material' })));
    }

    return articulos;
  }

  async getAlmacenesDisponibles(empresaId: number) {
    return this.almacenRepository.find({
      where: { idEmpresa: empresaId },
      select: ['id', 'nombre'],
    });
  }

  async getStockActual(filters: FilterStockActualDto, empresaId: number) {
    const { tipoArticulo, idAlmacenes, search } = filters;
    let results: any[] = [];

    const buildQuery = (repository: Repository<any>, idField: string, tArt: string) => {
      const qb = repository.createQueryBuilder('stock')
        .leftJoinAndSelect('stock.almacen', 'almacen')
        .where('stock.idEmpresa = :empresaId', { empresaId });

      if (idAlmacenes && idAlmacenes.length > 0) {
        qb.andWhere('stock.idAlmacen IN (:...idAlmacenes)', { idAlmacenes });
      }
      return qb;
    };

    if (tipoArticulo === TipoArticulo.PRODUCTO) {
      const prodStocks = await buildQuery(this.stockProductoRepository, 'idProducto', 'producto').getMany();
      results.push(...prodStocks.map(s => ({ ...s, idArticulo: s.idProducto, tipoArticulo: 'producto' })));
    } else if (tipoArticulo === TipoArticulo.MATERIAL) {
      const matStocks = await buildQuery(this.stockMaterialRepository, 'idMaterial', 'material').getMany();
      results.push(...matStocks.map(s => ({ ...s, idArticulo: s.idMaterial, tipoArticulo: 'material' })));
    }

    // Obtener info de productos y materiales para los nombres/códigos
    const productosIds = results.filter(r => r.tipoArticulo === 'producto').map(r => r.idArticulo);
    const materialesIds = results.filter(r => r.tipoArticulo === 'material').map(r => r.idArticulo);

    const productosInfo = new Map();
    const materialesInfo = new Map();

    if (productosIds.length > 0) {
      const productos = await this.productoRepository.find({
        where: productosIds.map(id => ({ id, idEmpresa: empresaId })) as any,
      });
      productos.forEach(p => productosInfo.set(p.id, p));
    } else if (materialesIds.length > 0) {
      const materiales = await this.materialRepository.find({
        where: materialesIds.map(id => ({ id, idEmpresa: empresaId })) as any,
      });
      materiales.forEach(m => materialesInfo.set(m.id, m));
    }

    // Formatear y filtrar por search
    let formatted = results.map(r => {
      const articulo = r.tipoArticulo === 'producto'
        ? productosInfo.get(r.idArticulo)
        : materialesInfo.get(r.idArticulo);

      const cantidad = parseFloat(r.stockActual.toString());
      const precio = articulo?.precio ? parseFloat(articulo.precio.toString()) : 0;

      return {
        ...r,
        nombre: articulo?.nombre || 'N/A',
        codigo: articulo?.codigo || 'N/A',
        stockMinimo: articulo?.stockMinimo || 0,
        tipoProducto: r.tipoArticulo === 'producto' ? (articulo?.tipoProducto || null) : undefined,
        precio: precio,
        total: cantidad * precio,
        cantidad: cantidad, // Para compatibilidad con el frontend si espera 'cantidad'
      };
    });

    if (search) {
      const searchLower = search.toLowerCase();
      formatted = formatted.filter(f =>
        f.nombre.toLowerCase().includes(searchLower) ||
        f.codigo.toLowerCase().includes(searchLower)
      );
    }

    return formatted;
  }
}

