import {RequestMethod, type INestApplication} from '@nestjs/common';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {Request, Response} from 'express';
import {DocumentBuilder, SwaggerModule, type OpenAPIObject} from '@nestjs/swagger';
import {ZodValidationPipe} from 'nestjs-zod';
import {version} from '../package.json';
import {applySecurity} from './security/apply-security';
import {AppConfigService} from './config/app-config.service';

/** Routes that stay outside the `/v1` prefix (OpenAPI only). */
export const GLOBAL_PREFIX_EXCLUDES = [
  {path: 'docs', method: RequestMethod.ALL},
  {path: 'docs-json', method: RequestMethod.ALL},
  {path: 'docs/(.*)', method: RequestMethod.ALL}
];

/**
 * Settings shared by production (`main.ts`) and e2e tests: global `/v1`
 * prefix (minus docs), Zod body/param validation, and OpenAPI at `/docs`
 * only when `SWAGGER_ENABLED=true`. Guards, the exception filter and the
 * request-id middleware come from `AppModule` itself.
 */
export function setupApp(app: INestApplication): void {
  const config = app.get(AppConfigService);
  applySecurity(app as NestExpressApplication, config);
  const limit = `${String(config.bodyLimitKb)}kb`;
  // Preserve the exact bytes used for webhook HMAC verification while still
  // parsing JSON normally for every controller.
  (app as NestExpressApplication).useBodyParser('json', {
    limit,
    verify: (request: Request & {rawBody?: Buffer}, _response: Response, buffer: Buffer) => {
      request.rawBody = Buffer.from(buffer);
    }
  });
  (app as NestExpressApplication).useBodyParser('urlencoded', {extended: false, limit});
  app.setGlobalPrefix('v1', {exclude: GLOBAL_PREFIX_EXCLUDES});
  app.useGlobalPipes(new ZodValidationPipe());
  if (config.swaggerEnabled) {
    SwaggerModule.setup('docs', app, buildOpenApiDocument(app));
  }
}

/** The OpenAPI document served at `/docs-json` and written by `npm run openapi`. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Invitation Platform API')
      .setDescription('REST API (v1). Bearer <Supabase JWT> on every route unless marked public.')
      .setVersion(version)
      .addBearerAuth()
      .build()
  );
}
