import {Global, Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AppConfigService} from './app-config.service';
import {validateEnv} from './env.schema';

/** Global config: validates the environment once at boot (fail fast) and
 * exposes the typed `AppConfigService` everywhere. */
@Global()
@Module({
  imports: [ConfigModule.forRoot({isGlobal: true, cache: true, validate: validateEnv})],
  providers: [AppConfigService],
  exports: [AppConfigService]
})
export class AppConfigModule {}
