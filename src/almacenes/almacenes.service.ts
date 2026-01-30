import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from '../entities/almacen.entity';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';

@Injectable()
export class AlmacenesService {
  constructor(
    @InjectRepository(Almacen)
    private almacenRepository: Repository<Almacen>,
  ) {}

  async findAll(empresaId: number): Promise<Almacen[]> {
    return this.almacenRepository.find({
      where: { idEmpresa: empresaId },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, empresaId: number): Promise<Almacen> {
    const almacen = await this.almacenRepository.findOne({
      where: { id, idEmpresa: empresaId },
    });

    if (!almacen) {
      throw new NotFoundException(`Almacén con ID ${id} no encontrado`);
    }

    return almacen;
  }

  async create(createAlmacenDto: CreateAlmacenDto, empresaId: number): Promise<Almacen> {
    const almacen = this.almacenRepository.create({
      ...createAlmacenDto,
      idEmpresa: empresaId,
    });

    return this.almacenRepository.save(almacen);
  }

  async update(
    id: number,
    updateAlmacenDto: UpdateAlmacenDto,
    empresaId: number,
  ): Promise<Almacen> {
    const almacen = await this.findOne(id, empresaId);
    Object.assign(almacen, updateAlmacenDto);
    return this.almacenRepository.save(almacen);
  }

  async remove(id: number, empresaId: number): Promise<void> {
    const almacen = await this.findOne(id, empresaId);
    await this.almacenRepository.remove(almacen);
  }
}
