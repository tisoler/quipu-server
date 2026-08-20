import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { MovimientoProducto } from '../entities/movimiento-producto.entity';
import { MovimientoMaterial } from '../entities/movimiento-material.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { FilterMovimientoDto } from './dto/filter-movimiento.dto';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { TipoMovimiento, TipoArticulo, EstadoMovimiento } from '../entities/movimiento.types';
import { StockProducto } from '../entities/stock-producto.entity';
import { StockMaterial } from '../entities/stock-material.entity';


@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(MovimientoProducto)
    private movimientoProductoRepository: Repository<MovimientoProducto>,
    @InjectRepository(MovimientoMaterial)
    private movimientoMaterialRepository: Repository<MovimientoMaterial>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) { }


  async findAll(filters: FilterMovimientoDto, empresaId: number) {
    const { tipoArticulo } = filters;

    // Si no hay tipoArticulo especificado, es más complejo porque son dos tablas.
    // Para simplificar, si no se especifica, podríamos devolver vacío o lanzar error, 
    // pero para mantener compatibilidad haremos un query condicional o ambos.

    if (tipoArticulo === TipoArticulo.PRODUCTO) {
      return this.findAllByType(this.movimientoProductoRepository, filters, empresaId);
    } else if (tipoArticulo === TipoArticulo.MATERIAL) {
      return this.findAllByType(this.movimientoMaterialRepository, filters, empresaId);
    } else {
      // Dado que el frontend suele filtrar, esto debería ser suficiente.
      // Idealmente aquí se haría un UNION si se requiere vista global real.
      return this.findAllByType(this.movimientoProductoRepository, filters, empresaId);
    }
  }

  private async findAllByType(repository: Repository<any>, filters: FilterMovimientoDto, empresaId: number) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { fechaDesde, fechaHasta, tipoMovimiento, estado, idAlmacen, search, tipoArticulo } = filters;
    const skip = (page - 1) * limit;

    const alias = 'movimiento';
    const queryBuilder = repository.createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.almacen`, 'almacen')
      .leftJoinAndSelect(tipoArticulo === TipoArticulo.MATERIAL ? `${alias}.material` : `${alias}.producto`, 'articulo')
      .where(`${alias}.idEmpresa = :empresaId`, { empresaId });

    let fDesde = fechaDesde;
    let fHasta = fechaHasta;

    if (fHasta) {
      // Tomamos la parte YYYY-MM-DD y forzamos el final del día en horario LOCAL
      const dateString = fHasta.toString().split('T')[0];
      const d = new Date(`${dateString}T23:59:59.999`);
      fHasta = d as any;
    }

    if (fDesde && fHasta) {
      queryBuilder.andWhere(`${alias}.fecha BETWEEN :fDesde AND :fHasta`, { fDesde, fHasta });
    } else if (fDesde) {
      queryBuilder.andWhere(`${alias}.fecha >= :fDesde`, { fDesde });
    } else if (fHasta) {
      queryBuilder.andWhere(`${alias}.fecha <= :fHasta`, { fHasta });
    }

    if (tipoMovimiento) {
      queryBuilder.andWhere(`${alias}.tipoMovimiento = :tipoMovimiento`, { tipoMovimiento });
    }

    if (estado) {
      queryBuilder.andWhere(`${alias}.estado = :estado`, { estado });
    } else {
      queryBuilder.andWhere(`${alias}.estado = :estado`, { estado: EstadoMovimiento.ACTIVO });
    }

    if (idAlmacen) {
      queryBuilder.andWhere(`${alias}.idAlmacen = :idAlmacen`, { idAlmacen });
    }

    if (search) {
      const idField = tipoArticulo === TipoArticulo.MATERIAL ? 'idMaterial' : 'idProducto';
      queryBuilder.andWhere(
        `(${alias}.descripcion ILIKE :search OR CAST(${alias}.${idField} AS TEXT) ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`${alias}.fecha`, 'DESC');
    queryBuilder.skip(skip);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map(item => ({ ...item, articulo: item.producto || item.material, tipoArticulo })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, empresaId: number, tipoArticulo?: TipoArticulo): Promise<any> {
    if (tipoArticulo === TipoArticulo.PRODUCTO) {
      return this.findOneByType(this.movimientoProductoRepository, id, empresaId, 'producto');
    } else if (tipoArticulo === TipoArticulo.MATERIAL) {
      return this.findOneByType(this.movimientoMaterialRepository, id, empresaId, 'material');
    } else {
      // Intentar en ambos si no se sabe (menos eficiente)
      const prod = await this.movimientoProductoRepository.findOne({ where: { id, idEmpresa: empresaId }, relations: ['almacen'] });
      if (prod) return { ...prod, tipoArticulo: 'producto' };
      const mat = await this.movimientoMaterialRepository.findOne({ where: { id, idEmpresa: empresaId }, relations: ['almacen'] });
      if (mat) return { ...mat, tipoArticulo: 'material' };
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }
  }

  private async findOneByType(repository: Repository<any>, id: number, empresaId: number, tipo: string) {
    const res = await repository.findOne({ where: { id, idEmpresa: empresaId }, relations: ['almacen'] });
    if (!res) throw new NotFoundException(`Movimiento de ${tipo} con ID ${id} no encontrado`);
    return { ...res, tipoArticulo: tipo };
  }

  async create(createMovimientoDto: CreateMovimientoDto, empresaId: number, userId: string, userName: string): Promise<any> {
    let repository: Repository<any>;
    let idFieldName: string;

    if (createMovimientoDto.tipoArticulo === TipoArticulo.PRODUCTO) {
      const producto = await this.productoRepository.findOne({
        where: { id: createMovimientoDto.idArticulo, idEmpresa: empresaId },
      });
      if (!producto) {
        throw new BadRequestException(`Producto con ID ${createMovimientoDto.idArticulo} no encontrado`);
      }
      if (!createMovimientoDto.precio) {
        createMovimientoDto.precio = Number(producto.precio);
      }
      repository = this.movimientoProductoRepository;
      idFieldName = 'idProducto';
    } else {
      const material = await this.materialRepository.findOne({
        where: { id: createMovimientoDto.idArticulo, idEmpresa: empresaId },
      });
      if (!material) {
        throw new BadRequestException(`Material con ID ${createMovimientoDto.idArticulo} no encontrado`);
      }
      if (!createMovimientoDto.precio) {
        createMovimientoDto.precio = Number(material.precio);
      }
      repository = this.movimientoMaterialRepository;
      idFieldName = 'idMaterial';
    }

    if (!createMovimientoDto.total) {
      createMovimientoDto.total = createMovimientoDto.cantidad * createMovimientoDto.precio;
    }

    const { idArticulo, ...dtoRest } = createMovimientoDto;
    const movimiento = repository.create({
      ...dtoRest,
      [idFieldName]: idArticulo,
      idEmpresa: empresaId,
      idUsuario: userId,
      nombreUsuario: userName,
      fecha: createMovimientoDto.fecha ? new Date(createMovimientoDto.fecha) : new Date(),
      estado: EstadoMovimiento.ACTIVO,
    });

    return await repository.manager.transaction(async (transactionalEntityManager) => {
      const savedMovimiento = await transactionalEntityManager.save(movimiento);
      await this.updateStockActual(
        transactionalEntityManager,
        idArticulo,
        createMovimientoDto.tipoArticulo,
        createMovimientoDto.idAlmacen,
        createMovimientoDto.cantidad,
        empresaId,
      );
      return savedMovimiento;
    });
  }

  private async updateStockActual(
    manager: EntityManager,
    idArticulo: number,
    tipoArticulo: TipoArticulo,
    idAlmacen: number,
    cantidad: number,
    idEmpresa: number,
  ) {
    const repository = tipoArticulo === TipoArticulo.PRODUCTO ? StockProducto : StockMaterial;
    const idField = tipoArticulo === TipoArticulo.PRODUCTO ? 'idProducto' : 'idMaterial';

    let stock = await manager.findOne(repository as any, {
      where: { [idField]: idArticulo, idAlmacen, idEmpresa } as any,
    });

    if (stock) {
      stock.stockActual = Number(stock.stockActual) + Number(cantidad);
      await manager.save(stock);
    } else {
      stock = manager.create(repository as any, {
        [idField]: idArticulo,
        idAlmacen,
        stockActual: cantidad,
        idEmpresa,
      });
      await manager.save(stock);
    }
  }

  async transferencia(
    createTransferenciaDto: CreateTransferenciaDto,
    empresaId: number,
    userId: string,
    userName: string,
  ) {
    const { tipoArticulo, idArticulo, idAlmacenOrigen, idAlmacenDestino, cantidad, descripcion } = createTransferenciaDto;

    let repository: Repository<any>;
    let idFieldName: string;
    let precio = 0;

    if (tipoArticulo === TipoArticulo.PRODUCTO) {
      const producto = await this.productoRepository.findOne({ where: { id: idArticulo, idEmpresa: empresaId } });
      if (!producto) throw new BadRequestException(`Producto ${idArticulo} no encontrado`);
      precio = Number(producto.precio);
      repository = this.movimientoProductoRepository;
      idFieldName = 'idProducto';
    } else {
      const material = await this.materialRepository.findOne({ where: { id: idArticulo, idEmpresa: empresaId } });
      if (!material) throw new BadRequestException(`Material ${idArticulo} no encontrado`);
      precio = Number(material.precio);
      repository = this.movimientoMaterialRepository;
      idFieldName = 'idMaterial';
    }

    const queryRunner = repository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const salida = repository.create({
        [idFieldName]: idArticulo,
        idAlmacen: idAlmacenOrigen,
        tipoMovimiento: TipoMovimiento.TRANSFERENCIA,
        cantidad: -cantidad,
        precio,
        total: -cantidad * precio,
        descripcion: descripcion ? `Transferencia (Salida): ${descripcion}` : `Transferencia a almacén ${idAlmacenDestino}`,
        idEmpresa: empresaId,
        idUsuario: userId,
        nombreUsuario: userName,
        fecha: new Date(),
        estado: EstadoMovimiento.ACTIVO,
      });

      const entrada = repository.create({
        [idFieldName]: idArticulo,
        idAlmacen: idAlmacenDestino,
        tipoMovimiento: TipoMovimiento.TRANSFERENCIA,
        cantidad: cantidad,
        precio,
        total: cantidad * precio,
        descripcion: descripcion ? `Transferencia (Entrada): ${descripcion}` : `Transferencia desde almacén ${idAlmacenOrigen}`,
        idEmpresa: empresaId,
        idUsuario: userId,
        nombreUsuario: userName,
        fecha: new Date(),
        estado: EstadoMovimiento.ACTIVO,
      });

      await queryRunner.manager.save(salida);
      await queryRunner.manager.save(entrada);

      await this.updateStockActual(queryRunner.manager, idArticulo, tipoArticulo, idAlmacenOrigen, -cantidad, empresaId);
      await this.updateStockActual(queryRunner.manager, idArticulo, tipoArticulo, idAlmacenDestino, cantidad, empresaId);

      await queryRunner.commitTransaction();
      return { message: 'Transferencia realizada', salida, entrada };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: number,
    updateMovimientoDto: UpdateMovimientoDto,
    empresaId: number,
  ): Promise<any> {
    const { tipoArticulo } = updateMovimientoDto;
    let mov;
    if (tipoArticulo) {
      const repository = tipoArticulo === TipoArticulo.PRODUCTO ? this.movimientoProductoRepository : this.movimientoMaterialRepository;
      mov = await repository.findOne({ where: { id, idEmpresa: empresaId } });
    } else {
      // Intentar en ambos si no se especifica
      mov = await this.findOne(id, empresaId);
    }

    if (!mov) throw new NotFoundException(`Movimiento no encontrado`);

    const repository = (mov.tipoArticulo === 'producto') ? this.movimientoProductoRepository : this.movimientoMaterialRepository;
    Object.assign(mov, updateMovimientoDto);
    const entityClass = (mov.tipoArticulo === 'producto') ? MovimientoProducto : MovimientoMaterial;
    return (repository as any).save(entityClass, mov);
  }

  async remove(id: number, empresaId: number, tipoArticulo?: TipoArticulo): Promise<any> {
    let mov;

    if (tipoArticulo) {
      const repository = tipoArticulo === TipoArticulo.PRODUCTO ? this.movimientoProductoRepository : this.movimientoMaterialRepository;
      mov = await repository.findOne({ where: { id, idEmpresa: empresaId } });
    } else {
      mov = await this.findOne(id, empresaId);
    }

    if (!mov) throw new NotFoundException(`Movimiento no encontrado`);

    const type = mov.tipoArticulo;
    const repository = (type === 'producto') ? this.movimientoProductoRepository : this.movimientoMaterialRepository;

    return await (repository as any).manager.transaction(async (transactionalEntityManager) => {
      mov.estado = EstadoMovimiento.ELIMINADO;
      const entityClass = (type === 'producto') ? MovimientoProducto : MovimientoMaterial;
      const savedMovimiento = await transactionalEntityManager.save(entityClass, mov);

      await this.updateStockActual(
        transactionalEntityManager,
        type === 'producto' ? mov.idProducto : mov.idMaterial,
        type as TipoArticulo,
        mov.idAlmacen,
        -mov.cantidad,
        empresaId,
      );

      return savedMovimiento;
    });
  }

}
