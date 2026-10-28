import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
  ) { }

  async findAll(empresaId: number): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { idEmpresa: empresaId },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, empresaId: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id, idEmpresa: empresaId },
    });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    return proveedor;
  }

  async create(dto: CreateProveedorDto, empresaId: number): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create({
      ...dto,
      idEmpresa: empresaId,
    });
    return this.proveedorRepository.save(proveedor);
  }

  async update(id: number, dto: UpdateProveedorDto, empresaId: number): Promise<Proveedor> {
    const proveedor = await this.findOne(id, empresaId);
    Object.assign(proveedor, dto);
    return this.proveedorRepository.save(proveedor);
  }

  async remove(id: number, empresaId: number): Promise<void> {
    const proveedor = await this.findOne(id, empresaId);
    await this.proveedorRepository.remove(proveedor);
  }
}
