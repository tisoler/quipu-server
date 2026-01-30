import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto, EstadoProducto } from '../entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { UpdateEstadoProductoDto } from './dto/update-estado-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async findAll(empresaId: number): Promise<Producto[]> {
    return this.productoRepository.find({
      where: { idEmpresa: empresaId },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, empresaId: number): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id, idEmpresa: empresaId },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async create(createProductoDto: CreateProductoDto, empresaId: number): Promise<Producto> {
    const producto = this.productoRepository.create({
      ...createProductoDto,
      idEmpresa: empresaId,
      estado: createProductoDto.estado || EstadoProducto.ACTIVO,
    });

    return this.productoRepository.save(producto);
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
    empresaId: number,
  ): Promise<Producto> {
    const producto = await this.findOne(id, empresaId);
    Object.assign(producto, updateProductoDto);
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
}
