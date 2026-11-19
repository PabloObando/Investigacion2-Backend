import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { resolve } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const frontendDist = process.env.FRONTEND_DIST;

  beforeEach(async () => {
    process.env.FRONTEND_DIST = resolve(__dirname, 'no-frontend-build');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
    if (frontendDist === undefined) delete process.env.FRONTEND_DIST;
    else process.env.FRONTEND_DIST = frontendDist;
  });
});
