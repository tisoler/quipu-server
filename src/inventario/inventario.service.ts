import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from '../entities/movimiento.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { Almacen } from '../entities/almacen.entity';
import { FilterInventarioDto } from './dto/filter-inventario.dto';
import { AgruparPor } from './dto/filter-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Movimiento)
    private movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Almacen)
    private almacenRepository: Repository<Almacen>,
  ) {}

  async getDatosGrafico(filters: FilterInventarioDto, empresaId: number) {
    const {
      tipoArticulo,
      agruparPor = AgruparPor.ARTICULO,
      idArticulos = [],
      idAlmacenes = [],
      fechaDesde,
      fechaHasta,
    } = filters;

    const queryBuilder = this.movimientoRepository
      .createQueryBuilder('movimiento')
      .where('movimiento.idEmpresa = :empresaId', { empresaId })
      .andWhere('movimiento.estado = :estado', { estado: 'activo' });

    if (tipoArticulo) {
      queryBuilder.andWhere('movimiento.tipoArticulo = :tipoArticulo', { tipoArticulo });
    }

    if (fechaDesde) {
      queryBuilder.andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde });
    }

    if (fechaHasta) {
      queryBuilder.andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta });
    }

    if (agruparPor === AgruparPor.ARTICULO) {
      if (idArticulos.length > 0) {
        queryBuilder.andWhere('movimiento.idArticulo IN (:...idArticulos)', { idArticulos });
      }
      queryBuilder
        .select([
          'movimiento.fecha as fecha',
          'movimiento.idArticulo as idArticulo',
          'movimiento.tipoArticulo as tipoArticulo',
          'MAX(movimiento.stockActualArticulo) as stock',
        ])
        .groupBy('movimiento.fecha')
        .addGroupBy('movimiento.idArticulo')
        .addGroupBy('movimiento.tipoArticulo')
        .orderBy('movimiento.fecha', 'ASC')
        .addOrderBy('movimiento.idArticulo', 'ASC');
    } else {
      // Agrupar por almacén
      if (idAlmacenes.length > 0) {
        queryBuilder.andWhere('movimiento.idAlmacen IN (:...idAlmacenes)', { idAlmacenes });
      }
      queryBuilder
        .select([
          'movimiento.fecha as fecha',
          'movimiento.idArticulo as idArticulo',
          'movimiento.tipoArticulo as tipoArticulo',
          'movimiento.idAlmacen as idAlmacen',
          'MAX(movimiento.stockActualAlmacen) as stock',
        ])
        .groupBy('movimiento.fecha')
        .addGroupBy('movimiento.idArticulo')
        .addGroupBy('movimiento.tipoArticulo')
        .addGroupBy('movimiento.idAlmacen')
        .orderBy('movimiento.fecha', 'ASC')
        .addOrderBy('movimiento.idArticulo', 'ASC')
        .addOrderBy('movimiento.idAlmacen', 'ASC');
    }

    const movimientos = await queryBuilder.getRawMany();

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
    const datos = movimientos.map((m) => ({
      fecha: m.fecha,
      idArticulo: m.idarticulo,
      tipoArticulo: m.tipoarticulo,
      idAlmacen: m.idalmacen || null,
      stock: parseFloat(m.stock || '0'),
      label:
        agruparPor === AgruparPor.ARTICULO
          ? articulosInfo.get(m.idarticulo)?.nombre || `Artículo ${m.idarticulo}`
          : `${articulosInfo.get(m.idarticulo)?.nombre || `Artículo ${m.idarticulo}`} - ${almacenesInfo.get(m.idalmacen) || 'N/A'}`,
      stockMinimo: agruparPor === AgruparPor.ARTICULO ? articulosInfo.get(m.idarticulo)?.stockMinimo || 0 : null,
    }));

    return datos;
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
}
