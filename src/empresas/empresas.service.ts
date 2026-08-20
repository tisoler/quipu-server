import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../entities/empresa.entity';

@Injectable()
export class EmpresasService {
    constructor(
        @InjectRepository(Empresa)
        private readonly empresaRepository: Repository<Empresa>,
    ) { }

    async findAll(): Promise<Empresa[]> {
        return this.empresaRepository.find();
    }

    async findOne(id: number): Promise<Empresa> {
        if (!id) return null;
        const empresa = await this.empresaRepository.findOne({ where: { id } });
        if (!empresa) {
            throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
        }
        return empresa;
    }
}
