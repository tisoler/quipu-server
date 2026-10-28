import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Producto, EstadoProducto } from '../entities/producto.entity';
import { Rubro } from '../entities/rubro.entity';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { UpdateEstadoProductoDto } from './dto/update-estado-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Rubro)
    private rubroRepository: Repository<Rubro>,
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
  ) { }

  async findAll(empresaId: number): Promise<Producto[]> {
    return this.productoRepository.find({
      where: { idEmpresa: empresaId },
      relations: ['rubros', 'proveedor'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, empresaId: number): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id, idEmpresa: empresaId },
      relations: ['rubros', 'proveedor'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async create(createProductoDto: CreateProductoDto, empresaId: number): Promise<Producto> {
    const { rubroIds, ...productData } = createProductoDto;
    await this.validarProveedor(productData.idProveedor, empresaId);

    const producto = this.productoRepository.create({
      ...productData,
      idEmpresa: empresaId,
      estado: createProductoDto.estado || EstadoProducto.ACTIVO,
    });

    if (rubroIds && rubroIds.length > 0) {
      producto.rubros = await this.rubroRepository.find({
        where: { id: In(rubroIds), idEmpresa: empresaId },
      });
    }

    return this.productoRepository.save(producto);
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
    empresaId: number,
  ): Promise<Producto> {
    const { rubroIds, ...productData } = updateProductoDto;
    const producto = await this.findOne(id, empresaId);

    if (productData.idProveedor !== undefined) {
      await this.validarProveedor(productData.idProveedor, empresaId);
    }

    Object.assign(producto, productData);

    if (rubroIds !== undefined) {
      if (rubroIds.length > 0) {
        producto.rubros = await this.rubroRepository.find({
          where: { id: In(rubroIds), idEmpresa: empresaId },
        });
      } else {
        producto.rubros = [];
      }
    }

    return this.productoRepository.save(producto);
  }

  async updateEstado(
    id: number,
    updateEstadoDto: UpdateEstadoProductoDto,
    empresaId: number,
  ): Promise<Producto> {
    const producto = await this.findOne(id, empresaId);
    producto.estado = updateEstadoDto.estado;
    return this.productoRepository.save(producto);
  }

  async remove(id: number, empresaId: number): Promise<void> {
    const producto = await this.findOne(id, empresaId);
    await this.productoRepository.remove(producto);
  }

  /** El proveedor asignado debe existir y ser de la misma empresa. */
  private async validarProveedor(idProveedor: number | null | undefined, empresaId: number) {
    if (idProveedor == null) return;
    const proveedor = await this.proveedorRepository.findOne({
      where: { id: idProveedor, idEmpresa: empresaId },
    });
    if (!proveedor) {
      throw new BadRequestException(`Proveedor ${idProveedor} no encontrado`);
    }
  }
}
