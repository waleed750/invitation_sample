import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminSettingsController, PublicSettingsController} from './admin-settings.controller';
import {AdminSettingsRepository} from './admin-settings.repository';
import {AdminSettingsService} from './admin-settings.service';

@Module({
  controllers: [AdminSettingsController, PublicSettingsController],
  providers: [AdminSettingsService, AdminSettingsRepository, AppLogger]
})
export class AdminSettingsModule {}
