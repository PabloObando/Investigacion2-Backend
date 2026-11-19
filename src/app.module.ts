import { Module } from '@nestjs/common';
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
export class AppModule {}
