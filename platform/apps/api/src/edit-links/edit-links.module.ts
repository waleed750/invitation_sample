import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminEditLinksController, EditLinksController} from './edit-links.controller';
import {EditLinksRepository} from './edit-links.repository';
import {EditLinksService} from './edit-links.service';

@Module({controllers: [AdminEditLinksController, EditLinksController], providers: [EditLinksService, EditLinksRepository, AppLogger]})
export class EditLinksModule {}
