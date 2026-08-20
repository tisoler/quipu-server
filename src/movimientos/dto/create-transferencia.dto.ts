import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TipoArticulo } from '../../entities/movimiento.types';

export class CreateTransferenciaDto {
    @ApiProperty({ enum: TipoArticulo })
    @IsEnum(TipoArticulo)
    @IsNotEmpty()
    tipoArticulo: TipoArticulo;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    idArticulo: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    idAlmacenOrigen: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    idAlmacenDestino: number;

    @ApiProperty()
    @IsNumber()
    @Min(0.01)
    @IsNotEmpty()
    cantidad: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    descripcion?: string;
}
