import {MiddlewareConsumer, Module, type NestModule} from '@nestjs/common';
import {APP_FILTER, APP_GUARD} from '@nestjs/core';
import {ScheduleModule} from '@nestjs/schedule';
import {ClientIpThrottlerGuard} from './security/client-ip-throttler.guard';
import {LoggerModule} from 'nestjs-pino';
import {AdminCustomersModule} from './admin-customers/admin-customers.module';
import {AdminPaymentsModule} from './admin-payments/admin-payments.module';
import {AuthModule, AuthGuard, RolesGuard} from './auth';
import {AppLogger} from './common/app-logger';
import {buildLoggerParams} from './common/logging';
import {HttpExceptionFilter} from './common/http-exception.filter';
import {RequestIdMiddleware} from './common/request-id.middleware';
import {AppConfigModule} from './config/app-config.module';
import {AppConfigService} from './config/app-config.service';
import {DatabaseModule} from './database/database.module';
import {EntitlementsModule} from './entitlements/entitlements.module';
import {HealthModule} from './health/health.module';
import {MeModule} from './me/me.module';
import {RateLimitModule} from './rate-limit/rate-limit.module';
import {SupabaseModule} from './supabase/supabase.module';
import {CheckoutModule} from './checkout/checkout.module';
import {GuestsModule} from './guests/guests.module';
import {InvitationsModule} from './invitations/invitations.module';
import {LifecycleModule} from './lifecycle/lifecycle.module';
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
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => buildLoggerParams(config.nodeEnv)
    }),
    DatabaseModule,
    SupabaseModule, RateLimitModule, AuthModule, HealthModule, MeModule, EntitlementsModule,
    PaymentsModule, TemplatesModule, CheckoutModule, OrdersModule, InvitationsModule, PointsModule,
    PublicInvitationsModule, GuestsModule, AdminPaymentsModule, AdminCustomersModule, LifecycleModule
    // lanes: append module imports below
  ],
  providers: [
    AppLogger,
    {provide: APP_GUARD, useClass: ClientIpThrottlerGuard},
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
