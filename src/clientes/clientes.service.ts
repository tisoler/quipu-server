import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) { }

  async findAll(empresaId: number, search?: string): Promise<Cliente[]> {
    const qb = this.clienteRepository.createQueryBuilder('cliente')
      .where('cliente.idEmpresa = :empresaId', { empresaId });
    if (search) {
      qb.andWhere('(cliente.nombre ILIKE :s OR cliente.cuit ILIKE :s)', { s: `%${search}%` });
    }
    qb.orderBy('cliente.nombre', 'ASC').take(100);
    return qb.getMany();
  }

  async findOne(id: number, empresaId: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({ where: { id, idEmpresa: empresaId } });
    if (!cliente) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return cliente;
  }

  async create(dto: CreateClienteDto, empresaId: number): Promise<Cliente> {
    const cliente = this.clienteRepository.create({ ...dto, idEmpresa: empresaId });
    return this.clienteRepository.save(cliente);
  }

  async update(id: number, dto: UpdateClienteDto, empresaId: number): Promise<Cliente> {
    const cliente = await this.findOne(id, empresaId);
    Object.assign(cliente, dto);
    return this.clienteRepository.save(cliente);
  }

  async remove(id: number, empresaId: number): Promise<void> {
    const cliente = await this.findOne(id, empresaId);
    await this.clienteRepository.remove(cliente);
  }
}
