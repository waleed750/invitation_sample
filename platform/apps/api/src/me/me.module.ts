import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {MediaModule} from '../media/media.module';
import {AccountController} from './account.controller';
import {AccountRepository} from './account.repository';
import {AccountService} from './account.service';
import {MeController} from './me.controller';
import {MeRepository} from './me.repository';
import {MeService} from './me.service';

@Module({
  imports: [MediaModule],
  controllers: [MeController, AccountController],
  providers: [MeService, MeRepository, AccountService, AccountRepository, AppLogger]
})
export class MeModule {}
