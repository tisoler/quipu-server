import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { MaterialesModule } from './materiales/materiales.module';
import { AlmacenesModule } from './almacenes/almacenes.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { InventarioModule } from './inventario/inventario.module';
import { Empresa } from './entities/empresa.entity';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { RolPermisos } from './entities/rol-permisos.entity';
import { Producto } from './entities/producto.entity';
import { Material } from './entities/material.entity';
import { Almacen } from './entities/almacen.entity';
import { Movimiento } from './entities/movimiento.entity';

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
          Usuario,
          Rol,
          Permiso,
          UsuarioRol,
          RolPermisos,
          Producto,
          Material,
          Almacen,
          Movimiento,
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
  ],
})
export class AppModule {}
