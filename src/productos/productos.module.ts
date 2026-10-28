import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { Producto } from '../entities/producto.entity';
import { Rubro } from '../entities/rubro.entity';
import { Proveedor } from '../entities/proveedor.entity';
import { AuthModule } from '../auth/auth.module';
import { RubrosModule } from '../rubros/rubros.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Producto, Rubro, Proveedor]),
    AuthModule,
    RubrosModule
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule { }
