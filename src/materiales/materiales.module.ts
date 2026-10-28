import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialesService } from './materiales.service';
import { MaterialesController } from './materiales.controller';
import { Material } from '../entities/material.entity';
import { Proveedor } from '../entities/proveedor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Proveedor]), AuthModule],
  controllers: [MaterialesController],
  providers: [MaterialesService],
})
export class MaterialesModule {}
