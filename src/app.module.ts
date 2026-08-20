import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { MaterialesModule } from './materiales/materiales.module';
import { AlmacenesModule } from './almacenes/almacenes.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { InventarioModule } from './inventario/inventario.module';
import { EmpresasModule } from './empresas/empresas.module';
import { Empresa } from './entities/empresa.entity';
import { Producto } from './entities/producto.entity';
import { Material } from './entities/material.entity';
import { Almacen } from './entities/almacen.entity';
import { MovimientoProducto } from './entities/movimiento-producto.entity';
import { MovimientoMaterial } from './entities/movimiento-material.entity';
import { StockProducto } from './entities/stock-producto.entity';
import { StockMaterial } from './entities/stock-material.entity';
import { Rubro } from './entities/rubro.entity';
import { RubrosModule } from './rubros/rubros.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Empresa,
          Producto,
          Material,
          Almacen,
          MovimientoProducto,
          MovimientoMaterial,
          StockProducto,
          StockMaterial,
          Rubro,
        ],

        synchronize: false, // Usar migraciones en producción
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ProductosModule,
    MaterialesModule,
    AlmacenesModule,
    MovimientosModule,
    InventarioModule,
    EmpresasModule,
    RubrosModule,
  ],
})
export class AppModule { }
