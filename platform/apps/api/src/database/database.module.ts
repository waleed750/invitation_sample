import {Global, Module} from '@nestjs/common';
import postgres from 'postgres';
import {AppConfigService} from '../config/app-config.service';
import {DbService, POSTGRES_POOL} from './db.service';

/**
 * Global: repositories inject `DbService`. The pool is created lazily by
 * postgres.js (no connection until the first query), so booting never needs a
 * reachable database.
 */
@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): postgres.Sql =>
        postgres(config.databaseUrl, {
          max: config.databasePoolMax,
          idle_timeout: 30,
          connect_timeout: 10,
          max_lifetime: 60 * 30,
          // Server-side cap per statement; an outage/hang degrades to a fast error.
          connection: {statement_timeout: config.databaseStatementTimeoutMs},
          onnotice: () => undefined
        })
    },
    DbService
  ],
  exports: [DbService]
})
export class DatabaseModule {}
