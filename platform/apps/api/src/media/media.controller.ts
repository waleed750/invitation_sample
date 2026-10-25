import {Controller, Delete, Get, HttpCode, Param, Post, Req} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {createZodDto} from 'nestjs-zod';
import type {Request} from 'express';
import {z} from 'zod';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {MediaService, type MediaItem, type MediaListResponse} from './media.service';

class MediaIdParams extends createZodDto(z.object({id: z.uuid('media id must be a UUID')})) {}

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** multipart/form-data: optional `invitationId`, then `file`. Streamed to disk; never buffered in memory. */
  @Post()
  @Throttle({default: {limit: 30, ttl: 60_000}})
  upload(@Req() request: Request, @CurrentUser() user: RequestUser): Promise<MediaItem> {
    return this.media.upload(user, request);
  }

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<MediaListResponse> {
    return this.media.list(user);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param() params: MediaIdParams, @CurrentUser() user: RequestUser): Promise<void> {
    await this.media.remove(user, params.id);
  }
}
