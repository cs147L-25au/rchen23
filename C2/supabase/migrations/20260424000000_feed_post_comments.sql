-- =============================================================================
-- Feed post comments, threaded replies, and comment likes
-- =============================================================================
-- Assumes:
--   - public.feed_posts(id uuid, event_id, ...) already exists
--   - user ids align with auth.users(id) (Supabase default)
--
-- If anything fails, verify in Supabase → Table Editor:
--   - feed_posts.id type (uuid vs text). If text, change uuid -> text in this file.
-- =============================================================================

-- Optional: total comments per feed post (for badges / “12 comments” on feed)
alter table public.feed_posts
  add column if not exists comment_count integer not null default 0;

-- -----------------------------------------------------------------------------
-- 1) Comments: one row per comment; replies use parent_comment_id -> same table
-- -----------------------------------------------------------------------------
create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null
    references public.feed_posts (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  -- null = top-level comment; set to another comment’s id to reply (same post)
  parent_comment_id uuid
    references public.feed_post_comments (id) on delete cascade,
  body text not null,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_post_comments_body_len check (char_length(body) between 1 and 8000)
);

create index if not exists feed_post_comments_post_id_idx
  on public.feed_post_comments (post_id);

create index if not exists feed_post_comments_parent_idx
  on public.feed_post_comments (parent_comment_id)
  where parent_comment_id is not null;

create index if not exists feed_post_comments_user_id_idx
  on public.feed_post_comments (user_id);

-- Parent comment must be on the same feed post
create or replace function public.feed_post_comments_enforce_parent_post()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is not null then
    if not exists (
      select 1
      from public.feed_post_comments c
      where c.id = new.parent_comment_id
        and c.post_id = new.post_id
    ) then
      raise exception 'parent_comment_id must refer to a comment on the same post_id';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_post_comments_enforce_parent_post
  on public.feed_post_comments;

create trigger trg_feed_post_comments_enforce_parent_post
  before insert or update of post_id, parent_comment_id
  on public.feed_post_comments
  for each row
  execute function public.feed_post_comments_enforce_parent_post();

-- Keep feed_posts.comment_count in sync
create or replace function public.feed_posts_bump_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_posts
      set comment_count = comment_count + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.feed_posts
      set comment_count = greatest(comment_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_feed_post_comments_bump_count on public.feed_post_comments;

create trigger trg_feed_post_comments_bump_count
  after insert or delete on public.feed_post_comments
  for each row
  execute function public.feed_posts_bump_comment_count();

-- updated_at on edit
create or replace function public.set_feed_post_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feed_post_comments_updated_at on public.feed_post_comments;

create trigger trg_feed_post_comments_updated_at
  before update of body on public.feed_post_comments
  for each row
  execute function public.set_feed_post_comments_updated_at();

-- -----------------------------------------------------------------------------
-- 2) Comment likes (one row per user per comment)
-- -----------------------------------------------------------------------------
create table if not exists public.feed_post_comment_likes (
  comment_id uuid not null
    references public.feed_post_comments (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists feed_post_comment_likes_user_idx
  on public.feed_post_comment_likes (user_id);

-- Bump comment.like_count
create or replace function public.feed_post_comment_likes_bump()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_post_comments
      set like_count = like_count + 1
      where id = new.comment_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.feed_post_comments
      set like_count = greatest(like_count - 1, 0)
      where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_feed_post_comment_likes_bump
  on public.feed_post_comment_likes;

create trigger trg_feed_post_comment_likes_bump
  after insert or delete on public.feed_post_comment_likes
  for each row
  execute function public.feed_post_comment_likes_bump();

-- -----------------------------------------------------------------------------
-- 3) Row Level Security
-- -----------------------------------------------------------------------------
alter table public.feed_post_comments enable row level security;
alter table public.feed_post_comment_likes enable row level security;

-- Comments: any signed-in user can read; only author can insert/update/delete own rows
-- (Tighten later, e.g. only friends of post owner, if you add that rule to feed_events.)
drop policy if exists "feed_post_comments_select_authenticated" on public.feed_post_comments;
create policy "feed_post_comments_select_authenticated"
  on public.feed_post_comments
  for select
  to authenticated
  using ( true );

drop policy if exists "feed_post_comments_insert_own" on public.feed_post_comments;
create policy "feed_post_comments_insert_own"
  on public.feed_post_comments
  for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "feed_post_comments_update_own" on public.feed_post_comments;
create policy "feed_post_comments_update_own"
  on public.feed_post_comments
  for update
  to authenticated
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

drop policy if exists "feed_post_comments_delete_own" on public.feed_post_comments;
create policy "feed_post_comments_delete_own"
  on public.feed_post_comments
  for delete
  to authenticated
  using ( auth.uid() = user_id );

-- Likes: read all; users may only add/remove their own like rows
drop policy if exists "feed_post_comment_likes_select_authenticated" on public.feed_post_comment_likes;
create policy "feed_post_comment_likes_select_authenticated"
  on public.feed_post_comment_likes
  for select
  to authenticated
  using ( true );

drop policy if exists "feed_post_comment_likes_insert_own" on public.feed_post_comment_likes;
create policy "feed_post_comment_likes_insert_own"
  on public.feed_post_comment_likes
  for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "feed_post_comment_likes_delete_own" on public.feed_post_comment_likes;
create policy "feed_post_comment_likes_delete_own"
  on public.feed_post_comment_likes
  for delete
  to authenticated
  using ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- 4) Grants (Supabase often grants by default; explicit for app roles)
-- -----------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.feed_post_comments to postgres, service_role;
grant select, insert, update, delete on public.feed_post_comments to authenticated;
grant all on public.feed_post_comment_likes to postgres, service_role;
grant select, insert, delete on public.feed_post_comment_likes to authenticated;

-- If public cannot read feed_posts, comments policies alone won’t help loading threads;
-- that is already configured for your feed/like features.

-- -----------------------------------------------------------------------------
-- 5) (Optional) Realtime: uncomment to broadcast new comments/likes to clients
-- -----------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.feed_post_comments;
-- alter publication supabase_realtime add table public.feed_post_comment_likes;
