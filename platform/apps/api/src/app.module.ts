import {MiddlewareConsumer, Module, type NestModule} from '@nestjs/common';
import {APP_FILTER, APP_GUARD} from '@nestjs/core';
import {ThrottlerGuard} from '@nestjs/throttler';
import {LoggerModule} from 'nestjs-pino';
import {AuthModule, AuthGuard, RolesGuard} from './auth';
import {AppLogger} from './common/app-logger';
import {buildLoggerParams} from './common/logging';
import {HttpExceptionFilter} from './common/http-exception.filter';
import {RequestIdMiddleware} from './common/request-id.middleware';
import {AppConfigModule} from './config/app-config.module';
import {AppConfigService} from './config/app-config.service';
import {EntitlementsModule} from './entitlements/entitlements.module';
import {HealthModule} from './health/health.module';
import {MeModule} from './me/me.module';
import {RateLimitModule} from './rate-limit/rate-limit.module';
import {SupabaseModule} from './supabase/supabase.module';
import {CheckoutModule} from './checkout/checkout.module';
import {GuestsModule} from './guests/guests.module';
import {InvitationsModule} from './invitations/invitations.module';
import {OrdersModule} from './orders/orders.module';
import {PaymentsModule} from './payments/payments.module';
import {PointsModule} from './points/points.module';
import {PublicInvitationsModule} from './public-invitations/public-invitations.module';
import {TemplatesModule} from './templates/templates.module';

export {AuthModule};
export {AuthGuard, RolesGuard};

/**
 * Guard order matters (guards run in registration order):
 * 1. `ThrottlerGuard` — shed abusive traffic first, even unauthenticated.
 * 2. `AuthGuard` — everything is protected unless `@Public()`.
 * 3. `RolesGuard` — `@Roles('admin')` routes check `profiles.role`.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => buildLoggerParams(config.nodeEnv)
    }),
    SupabaseModule, RateLimitModule, AuthModule, HealthModule, MeModule, EntitlementsModule,
    PaymentsModule, TemplatesModule, CheckoutModule, OrdersModule, InvitationsModule, PointsModule,
    PublicInvitationsModule, GuestsModule
  ],
  providers: [
    AppLogger,
    {provide: APP_GUARD, useClass: ThrottlerGuard},
    {provide: APP_GUARD, useClass: AuthGuard},
    {provide: APP_GUARD, useClass: RolesGuard},
    {provide: APP_FILTER, useClass: HttpExceptionFilter}
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
