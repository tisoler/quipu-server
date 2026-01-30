import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Movimiento, EstadoMovimiento } from '../entities/movimiento.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { FilterMovimientoDto } from './dto/filter-movimiento.dto';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async findAll(filters: FilterMovimientoDto, empresaId: number) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { fechaDesde, fechaHasta, tipoArticulo, tipoMovimiento, estado, idAlmacen, search } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.movimientoRepository
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.almacen', 'almacen')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .where('movimiento.idEmpresa = :empresaId', { empresaId });

    if (fechaDesde && fechaHasta) {
      queryBuilder.andWhere('movimiento.fecha BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde,
        fechaHasta,
      });
    } else if (fechaDesde) {
      queryBuilder.andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde });
    } else if (fechaHasta) {
      queryBuilder.andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta });
    }

    if (tipoArticulo) {
      queryBuilder.andWhere('movimiento.tipoArticulo = :tipoArticulo', { tipoArticulo });
    }

    if (tipoMovimiento) {
      queryBuilder.andWhere('movimiento.tipoMovimiento = :tipoMovimiento', { tipoMovimiento });
    }

    if (estado) {
      queryBuilder.andWhere('movimiento.estado = :estado', { estado });
    } else {
      // Por defecto solo mostrar activos
      queryBuilder.andWhere('movimiento.estado = :estado', { estado: EstadoMovimiento.ACTIVO });
    }

    if (idAlmacen) {
      queryBuilder.andWhere('movimiento.idAlmacen = :idAlmacen', { idAlmacen });
    }

    if (search) {
      queryBuilder.andWhere(
        '(movimiento.descripcion ILIKE :search OR CAST(movimiento.idArticulo AS TEXT) ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('movimiento.fecha', 'DESC');
    queryBuilder.skip(skip);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, empresaId: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id, idEmpresa: empresaId },
      relations: ['almacen', 'usuario'],
    });

    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }

    return movimiento;
  }

  async create(createMovimientoDto: CreateMovimientoDto, empresaId: number, userId: number): Promise<Movimiento> {
    // Validar que el artículo existe según el tipo
    if (createMovimientoDto.tipoArticulo === 'producto') {
      const producto = await this.productoRepository.findOne({
        where: { id: createMovimientoDto.idArticulo, idEmpresa: empresaId },
      });
      if (!producto) {
        throw new BadRequestException(`Producto con ID ${createMovimientoDto.idArticulo} no encontrado`);
      }
      // Si no se proporciona precio, usar el precio del producto
      if (!createMovimientoDto.precio) {
        createMovimientoDto.precio = Number(producto.precio);
      }
    } else if (createMovimientoDto.tipoArticulo === 'material') {
      const material = await this.materialRepository.findOne({
        where: { id: createMovimientoDto.idArticulo, idEmpresa: empresaId },
      });
      if (!material) {
        throw new BadRequestException(`Material con ID ${createMovimientoDto.idArticulo} no encontrado`);
      }
      // Si no se proporciona precio, usar el precio del material
      if (!createMovimientoDto.precio) {
        createMovimientoDto.precio = Number(material.precio);
      }
    }

    // Calcular total si no se proporciona
    if (!createMovimientoDto.total) {
      createMovimientoDto.total = createMovimientoDto.cantidad * createMovimientoDto.precio;
    }

    const movimiento = this.movimientoRepository.create({
      ...createMovimientoDto,
      idEmpresa: empresaId,
      idUsuario: userId,
      fecha: createMovimientoDto.fecha ? new Date(createMovimientoDto.fecha) : new Date(),
      estado: EstadoMovimiento.ACTIVO,
    });

    return this.movimientoRepository.save(movimiento);
  }

  async update(
    id: number,
    updateMovimientoDto: UpdateMovimientoDto,
    empresaId: number,
  ): Promise<Movimiento> {
    const movimiento = await this.findOne(id, empresaId);
    Object.assign(movimiento, updateMovimientoDto);
    return this.movimientoRepository.save(movimiento);
  }

  async remove(id: number, empresaId: number): Promise<Movimiento> {
    const movimiento = await this.findOne(id, empresaId);
    movimiento.estado = EstadoMovimiento.ELIMINADO;
    return this.movimientoRepository.save(movimiento);
  }
}
