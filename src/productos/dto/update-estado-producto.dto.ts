import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoProducto } from '../../entities/producto.entity';

export class UpdateEstadoProductoDto {
  @ApiProperty({ enum: EstadoProducto })
  @IsEnum(EstadoProducto)
  @IsNotEmpty()
  estado: EstadoProducto;
}
