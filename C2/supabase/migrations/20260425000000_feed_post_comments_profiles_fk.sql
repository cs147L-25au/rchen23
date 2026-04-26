-- =============================================================================
-- PostgREST / Supabase: user_id -> public.profiles (for FK-based joins in API)
-- =============================================================================
-- Replaces auth.users FK with public.profiles(id) (profile id == auth user id).
-- Run in Supabase SQL editor after 20260424000000_feed_post_comments.sql.
--
-- PGRST200 (before this migration): no feed_post_comments <-> profiles FK.
-- PGRST201 (after this migration, if the client still uses a bare "profiles" embed
--   on feed_post_comments): PostgREST finds MORE THAN ONE path to "profiles":
--   - the comment author: feed_post_comments.user_id -> profiles
--   - via comment likes: feed_post_comment_likes links comments to other users
--   who have profiles, so a generic "profiles" hint is ambiguous.
-- Fix in application code (pick one):
--   1) Recommended: do not embed — load comments, then load profiles in a second
--      query (see lib/commentsDb.ts: fetchProfilesByUserIds + mapCommentRow).
--   2) If you must embed the AUTHOR only, disambiguate with the constraint name:
--        .select("..., profiles!feed_post_comments_user_id_fkey (display_name, profile_pic)")
--   3) For "who liked this comment" profile rows, query feed_post_comment_likes
--      and embed profiles!feed_post_comment_likes_user_id_fkey(...), or merge
--      profiles in code.
-- =============================================================================

alter table public.feed_post_comments
  drop constraint if exists feed_post_comments_user_id_fkey;

alter table public.feed_post_comments
  add constraint feed_post_comments_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.feed_post_comment_likes
  drop constraint if exists feed_post_comment_likes_user_id_fkey;

alter table public.feed_post_comment_likes
  add constraint feed_post_comment_likes_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- Refresh PostgREST schema cache (Supabase: usually automatic; if errors persist, restart API or run NOTIFY)
