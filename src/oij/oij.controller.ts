import { Controller, Get, Query } from '@nestjs/common';
import { OijService } from './oij.service';

@Controller('api/oij')
export class OijController {
  constructor(private readonly oij: OijService) {}

  @Get('registros')
  buscar(@Query() query: Record<string, unknown>) {
    return this.oij.buscar(query);
  }
}
