import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { Movimiento } from '../entities/movimiento.entity';
import { Producto } from '../entities/producto.entity';
import { Material } from '../entities/material.entity';
import { Almacen } from '../entities/almacen.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movimiento, Producto, Material, Almacen]),
    AuthModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
