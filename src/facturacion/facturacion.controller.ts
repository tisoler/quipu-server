import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
  UseGuards,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FacturacionService } from './facturacion.service';
import { PdfFacturaService } from './pdf.service';
import { EmitirFacturaDto } from './dto/emitir-factura.dto';
import { CopiaComprobante } from './dto/pdf-factura.dto';
import { FirebaseGuard } from '../auth/guards/firebase.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Comprobante, EstadoComprobante } from '../entities/comprobante.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from '../entities/venta.entity';

@ApiTags('facturacion')
@Controller('facturacion')
@UseGuards(FirebaseGuard, PermissionsGuard)
@ApiBearerAuth()
export class FacturacionController {
  constructor(
    private readonly facturacionService: FacturacionService,
    private readonly pdfService: PdfFacturaService,
    @InjectRepository(Comprobante) private comprobanteRepository: Repository<Comprobante>,
    @InjectRepository(Venta) private ventaRepository: Repository<Venta>,
  ) { }

  @Get('ventas')
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Listar ventas con su estado fiscal' })
  listarVentas(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.facturacionService.listarVentas(req.user.idEmpresa, Number(page), Number(limit));
  }

  @Get('ventas/:id')
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Detalle de una venta con sus ítems y comprobante' })
  findVenta(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.facturacionService.findVenta(id, req.user.idEmpresa);
  }

  @Post('ventas/:id/emitir')
  @Permissions('escritura:facturacion')
  @ApiOperation({ summary: 'Emitir comprobante electrónico de una venta (una sola vez)' })
  emitir(@Param('id', ParseIntPipe) id: number, @Body() dto: EmitirFacturaDto, @Request() req) {
    return this.facturacionService.emitir(id, dto, req.user.idEmpresa);
  }

  @Post('ventas/:id/simulacion')
  @Permissions('escritura:facturacion')
  @ApiOperation({ summary: 'Simular el comprobante de una venta sin emitirlo (vista previa)' })
  simular(@Param('id', ParseIntPipe) id: number, @Body() dto: EmitirFacturaDto, @Request() req) {
    return this.facturacionService.simular(id, dto, req.user.idEmpresa);
  }

  @Get('ventas/:id/comprobante')
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Comprobante asociado a una venta' })
  getComprobante(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.facturacionService.getComprobante(id, req.user.idEmpresa);
  }

  @Post('ventas/:id/pdf-url')
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Publicar el PDF del comprobante en Spaces y obtener su URL para compartir' })
  pdfUrl(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.facturacionService.obtenerPdfUrl(id, req.user.idEmpresa);
  }

  @Get('ventas/:id/pdf')
  @Permissions('lectura:facturacion')
  @ApiOperation({ summary: 'Generar el PDF del comprobante (original/duplicado/triplicado)' })
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('copia') copia: CopiaComprobante = CopiaComprobante.ORIGINAL,
    @Request() req,
    @Res() res: Response,
  ) {
    const venta = await this.ventaRepository.findOne({ where: { id, idEmpresa: req.user.idEmpresa } });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    const comprobante = await this.comprobanteRepository.findOne({ where: { idVenta: id } });
    if (!comprobante) throw new NotFoundException('La venta no tiene comprobante');
    if (comprobante.estado !== EstadoComprobante.APROBADO) {
      throw new BadRequestException('El comprobante no está aprobado por ARCA');
    }

    const buffer = await this.pdfService.generar(comprobante, copia);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="comprobante_${comprobante.puntoVenta}_${comprobante.nroComprobante}_${copia}.pdf"`,
    );
    res.send(buffer);
  }
}
