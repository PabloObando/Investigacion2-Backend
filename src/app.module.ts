import { Module, NestModule } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { resolve } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TseModule } from './tse/tse.module';
import { OijController } from './oij/oij.controller';
import { OijService } from './oij/oij.service';

@Module({
  imports: [TseModule],
  controllers: [AppController, OijController],
  providers: [AppService, OijService],
})
export class AppModule implements NestModule {
  constructor(private readonly adapterHost: HttpAdapterHost<ExpressAdapter>) {}

  configure() {
    const frontend = process.env.FRONTEND_DIST
      ? resolve(process.env.FRONTEND_DIST)
      : resolve(__dirname, '../../Investigacion2-Frontend/dist');
    this.adapterHost.httpAdapter.useStaticAssets(frontend, {});
  }
}
