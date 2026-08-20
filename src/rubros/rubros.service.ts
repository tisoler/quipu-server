import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rubro } from '../entities/rubro.entity';
import { CreateRubroDto } from './dto/create-rubro.dto';
import { UpdateRubroDto } from './dto/update-rubro.dto';

@Injectable()
export class RubrosService {
    constructor(
        @InjectRepository(Rubro)
        private rubroRepository: Repository<Rubro>,
    ) { }

    async findAll(empresaId: number): Promise<Rubro[]> {
        return this.rubroRepository.find({
            where: { idEmpresa: empresaId },
            order: { nombre: 'ASC' },
        });
    }

    async findOne(id: number, empresaId: number): Promise<Rubro> {
        const rubro = await this.rubroRepository.findOne({
            where: { id, idEmpresa: empresaId },
        });
        if (!rubro) {
            throw new NotFoundException(`Rubro con ID ${id} no encontrado`);
        }
        return rubro;
    }

    async create(createRubroDto: CreateRubroDto, empresaId: number): Promise<Rubro> {
        const rubro = this.rubroRepository.create({
            ...createRubroDto,
            idEmpresa: empresaId,
        });
        return this.rubroRepository.save(rubro);
    }

    async update(id: number, updateRubroDto: UpdateRubroDto, empresaId: number): Promise<Rubro> {
        const rubro = await this.findOne(id, empresaId);
        Object.assign(rubro, updateRubroDto);
        return this.rubroRepository.save(rubro);
    }

    async remove(id: number, empresaId: number): Promise<void> {
        const rubro = await this.findOne(id, empresaId);
        await this.rubroRepository.remove(rubro);
    }
}
