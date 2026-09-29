import {Global, Module} from '@nestjs/common';
import {SupabaseService} from './supabase.service';

/** Global: every feature module injects `SupabaseService` instead of building clients. */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService]
})
export class SupabaseModule {}
