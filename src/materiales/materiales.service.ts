import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, EstadoMaterial } from '../entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateEstadoMaterialDto } from './dto/update-estado-material.dto';

@Injectable()
export class MaterialesService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async findAll(empresaId: number): Promise<Material[]> {
    return this.materialRepository.find({
      where: { idEmpresa: empresaId },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, empresaId: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id, idEmpresa: empresaId },
    });

    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    return material;
  }

  async create(createMaterialDto: CreateMaterialDto, empresaId: number): Promise<Material> {
    const material = this.materialRepository.create({
      ...createMaterialDto,
      idEmpresa: empresaId,
      estado: createMaterialDto.estado || EstadoMaterial.ACTIVO,
    });

    return this.materialRepository.save(material);
  }

  async update(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
    empresaId: number,
  ): Promise<Material> {
    const material = await this.findOne(id, empresaId);
    Object.assign(material, updateMaterialDto);
    return this.materialRepository.save(material);
  }

  async updateEstado(
    id: number,
    updateEstadoDto: UpdateEstadoMaterialDto,
    empresaId: number,
  ): Promise<Material> {
    const material = await this.findOne(id, empresaId);
    material.estado = updateEstadoDto.estado;
    return this.materialRepository.save(material);
  }

  async remove(id: number, empresaId: number): Promise<void> {
    const material = await this.findOne(id, empresaId);
    await this.materialRepository.remove(material);
  }
}
