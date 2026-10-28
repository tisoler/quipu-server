import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, EstadoMaterial } from '../entities/material.entity';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateEstadoMaterialDto } from './dto/update-estado-material.dto';

@Injectable()
export class MaterialesService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
  ) {}

  async findAll(empresaId: number): Promise<Material[]> {
    return this.materialRepository.find({
      where: { idEmpresa: empresaId },
      relations: ['proveedor'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, empresaId: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id, idEmpresa: empresaId },
      relations: ['proveedor'],
    });

    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    return material;
  }

  async create(createMaterialDto: CreateMaterialDto, empresaId: number): Promise<Material> {
    await this.validarProveedor(createMaterialDto.idProveedor, empresaId);

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
    if (updateMaterialDto.idProveedor !== undefined) {
      await this.validarProveedor(updateMaterialDto.idProveedor, empresaId);
    }
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
