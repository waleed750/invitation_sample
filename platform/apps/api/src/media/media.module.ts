import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {MediaController} from './media.controller';
import {MediaRepository} from './media.repository';
import {MediaService} from './media.service';
import {LocalDiskMediaStorage, MEDIA_STORAGE, S3MediaStorage, type MediaStorage} from './storage/media-storage';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaRepository,
    AppLogger,
    {
      provide: MEDIA_STORAGE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): MediaStorage => {
        const s3 = config.mediaStorage === 's3' ? config.mediaS3 : null;
        if (s3 !== null) return new S3MediaStorage({...s3, publicBaseUrl: config.mediaPublicBaseUrl});
        return new LocalDiskMediaStorage(config.mediaDir, config.mediaPublicBaseUrl);
      }
    }
  ],
  exports: [MediaService]
})
export class MediaModule {}
