import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for invitations. The only file here that talks to Supabase. */
@Injectable()
export class InvitationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Owner's invitations with template slug + entitlement, newest first (user JWT, RLS applies). Raw envelope. */
  async listByOwner(jwt: string, ownerId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitations')
      .select('id,order_id,slug,data,locale,status,created_at,template:templates(slug),entitlement:invitation_entitlements(tier,edits_allowed,edits_used,online_until)')
      .eq('owner_id', ownerId).order('created_at', {ascending: false});
  }

  /** One invitation with its entitlement (user JWT, RLS decides visibility; no row = hidden or missing). Raw envelope. */
  async findById(jwt: string, id: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitations')
      .select('id,slug,status,template_id,data,updated_at,published_at,entitlement:invitation_entitlements(tier,edits_allowed,edits_used,online_until)')
      .eq('id', id)
      .maybeSingle();
  }

  /**
   * Optimistic-concurrency write: updates `data` only while `updated_at` still equals `ifMatch`.
   * `ifMatch` is the raw `updated_at` string previously returned by Postgres (microsecond precision).
   * Returns the updated rows (empty = stale or hidden). Raw envelope.
   */
  async updateDataIfMatch(jwt: string, id: string, data: unknown, ifMatch: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitations')
      .update({data})
      .eq('id', id)
      .eq('updated_at', ifMatch)
      .select('updated_at');
  }

  /** Sets the share slug (user JWT; the `invitations_guard` trigger refuses it after publishing). Raw envelope. */
  async updateSlug(jwt: string, id: string, slug: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitations')
      .update({slug})
      .eq('id', id)
      .select('id');
  }

  /** `publish_invitation(id, data)` RPC. `authenticated` may execute it (0002); ownership is checked in SQL via auth.uid(). */
  async publish(jwt: string, id: string, data: unknown): Promise<unknown> {
    return this.supabase.forUser(jwt).rpc('publish_invitation', {p_invitation_id: id, p_data: data});
  }

  /** `undo_publish(id)` RPC (0012). `authenticated` may execute it; ownership is checked in SQL via auth.uid(). */
  async undoPublish(jwt: string, id: string): Promise<unknown> {
    return this.supabase.forUser(jwt).rpc('undo_publish', {p_invitation_id: id});
  }

  /** `switch_template(id, slug)` RPC (0012). Same privilege model as `publish`. */
  async switchTemplate(jwt: string, id: string, templateSlug: string): Promise<unknown> {
    return this.supabase.forUser(jwt).rpc('switch_template', {p_invitation_id: id, p_template_slug: templateSlug});
  }

  /**
   * Which of `slugs` are already used by any invitation (drafts included). Service role, because RLS hides
   * other people's drafts; the caller only ever gets the slug strings back, never any invitation data.
   */
  async slugsTakenAsServiceRole(slugs: string[]): Promise<unknown> {
    return this.supabase.admin().from('invitations').select('slug').in('slug', slugs);
  }
}
