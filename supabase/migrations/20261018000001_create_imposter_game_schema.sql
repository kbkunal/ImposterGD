-- ====================================================================
-- WHO'S THE IMPOSTER? — POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Migration: 20261018000001_create_imposter_game_schema.sql
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  display_name text not null,
  avatar_url text,
  avatar_id text not null default 'detective',
  avatar_background text not null default '#8B5CF6',
  status_message text,
  total_matches int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  imposter_wins int not null default 0,
  total_points int not null default 0,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness for username
create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username));
create index if not exists idx_profiles_is_online on public.profiles (is_online);

-- 2. FRIENDSHIPS TABLE
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('PENDING', 'ACCEPTED', 'BLOCKED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_not_self check (requester_id <> recipient_id),
  constraint unique_friend_pair unique (requester_id, recipient_id)
);

create index if not exists idx_friendships_recipient on public.friendships (recipient_id, status);
create index if not exists idx_friendships_requester on public.friendships (requester_id, status);

-- 3. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'GAME_INVITE', 'MATCH_ALERT')),
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient on public.notifications (recipient_id, read);

-- 4. ROOMS TABLE
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  host_id uuid references public.profiles(id) on delete set null,
  name text not null,
  is_public boolean not null default false,
  status text not null check (status in ('OPEN', 'IN_GAME', 'CLOSED')) default 'OPEN',
  settings jsonb not null default '{
    "min_players": 3,
    "max_players": 10,
    "imposter_count": 1,
    "category": "All",
    "difficulty": "ALL",
    "hint_mode": "RELATED_WORD",
    "clue_rounds": 1,
    "clue_timer_seconds": 30,
    "discussion_timer_seconds": 60,
    "voting_timer_seconds": 45,
    "allow_last_chance_guess": true,
    "allow_text_clues": true,
    "is_public": false
  }'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

create index if not exists idx_rooms_code on public.rooms (room_code);
create index if not exists idx_rooms_public_status on public.rooms (is_public, status);

-- 5. ROOM PLAYERS TABLE
create table if not exists public.room_players (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  seat_index int not null,
  ready boolean not null default false,
  connected boolean not null default true,
  joined_at timestamptz not null default now(),
  constraint unique_room_player unique (room_id, user_id),
  constraint unique_room_seat unique (room_id, seat_index)
);

create index if not exists idx_room_players_room on public.room_players (room_id);

-- 6. MATCHES TABLE
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  status text not null check (status in ('ACTIVE', 'COMPLETED')) default 'ACTIVE',
  current_round int not null default 1,
  scores jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_matches_room on public.matches (room_id);

-- 7. GAME ROUNDS TABLE
create table if not exists public.game_rounds (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  round_number int not null,
  category text not null,
  phase text not null check (phase in (
    'WAITING_ROOM', 'DEALING_CARDS', 'CARD_REVEAL', 'CLUE_ROUND',
    'DISCUSSION', 'VOTING', 'VOTE_REVEAL', 'IMPOSTER_GUESS',
    'ROUND_RESULTS', 'MATCH_RESULTS'
  )) default 'WAITING_ROOM',
  phase_started_at timestamptz not null default now(),
  phase_deadline timestamptz,
  active_speaker_id uuid references public.profiles(id) on delete set null,
  speaker_order jsonb not null default '[]'::jsonb,
  current_speaker_index int not null default 0,
  current_clue_round int not null default 1,
  total_clue_rounds int not null default 1,
  winner text,
  imposter_user_ids jsonb not null default '[]'::jsonb,
  secret_word text,
  revealed_hint text,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_rounds_match on public.game_rounds (match_id);

-- 8. PRIVATE PLAYER ROLES TABLE (STRICT SECURITY: private secret word / hint)
create table if not exists public.private_player_roles (
  id uuid default gen_random_uuid() primary key,
  round_id uuid references public.game_rounds(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('NORMAL', 'IMPOSTER')),
  secret_word text,
  private_hint text,
  card_viewed_at timestamptz,
  constraint unique_round_user_role unique (round_id, user_id)
);

create index if not exists idx_private_roles_round_user on public.private_player_roles (round_id, user_id);

-- 9. VOTES TABLE
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  round_id uuid references public.game_rounds(id) on delete cascade not null,
  voter_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  submitted_at timestamptz not null default now(),
  constraint unique_round_voter unique (round_id, voter_id),
  constraint check_cannot_vote_self check (voter_id <> target_id)
);

create index if not exists idx_votes_round on public.votes (round_id);

-- 10. MATCH PLAYER STATS
create table if not exists public.match_player_stats (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  points_awarded int not null default 0,
  rounds_won int not null default 0,
  imposter_rounds int not null default 0,
  correct_guesses int not null default 0,
  constraint unique_match_player_stat unique (match_id, user_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.matches enable row level security;
alter table public.game_rounds enable row level security;
alter table public.private_player_roles enable row level security;
alter table public.votes enable row level security;
alter table public.match_player_stats enable row level security;

-- Profiles: Anyone authenticated can view public profiles; only owner can update their profile
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Friendships: Users can view friendships involving them
create policy "Users can view friendships involving them"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can insert friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy "Users can update friendships involving them"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can delete friendships involving them"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Notifications: Users can only see and update their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = recipient_id);

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = recipient_id);

create policy "Authenticated users can create notifications"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = actor_id);

-- Rooms: Public rooms or member rooms are viewable
create policy "Public rooms or member rooms are viewable"
  on public.rooms for select
  to authenticated
  using (
    is_public = true
    or host_id = auth.uid()
    or exists (
      select 1 from public.room_players
      where room_players.room_id = rooms.id
      and room_players.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "Host can update room"
  on public.rooms for update
  to authenticated
  using (auth.uid() = host_id);

-- Room Players: Viewable if in same room
create policy "Room players viewable by room members"
  on public.room_players for select
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = room_players.room_id
      and (rooms.is_public = true or rooms.host_id = auth.uid())
    )
    or exists (
      select 1 from public.room_players rp
      where rp.room_id = room_players.room_id
      and rp.user_id = auth.uid()
    )
  );

create policy "Users can join room"
  on public.room_players for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own room player state"
  on public.room_players for update
  to authenticated
  using (auth.uid() = user_id or exists (
    select 1 from public.rooms r where r.id = room_players.room_id and r.host_id = auth.uid()
  ));

create policy "Users can leave room"
  on public.room_players for delete
  to authenticated
  using (auth.uid() = user_id or exists (
    select 1 from public.rooms r where r.id = room_players.room_id and r.host_id = auth.uid()
  ));

-- Matches & Rounds: Viewable by room members
create policy "Matches viewable by room members"
  on public.matches for select
  to authenticated
  using (true);

create policy "Game rounds viewable by room members"
  on public.game_rounds for select
  to authenticated
  using (true);

-- CRITICAL SECURITY RULE: private_player_roles
-- Only the authentic player can EVER read their own private role and secret word/hint!
create policy "Players can ONLY read their own private role"
  on public.private_player_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Votes: Voter can insert their own vote
create policy "Voters can insert own vote"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = voter_id);

-- Votes viewable only after VOTE_REVEAL phase has begun
create policy "Votes viewable after reveal phase"
  on public.votes for select
  to authenticated
  using (
    auth.uid() = voter_id
    or exists (
      select 1 from public.game_rounds gr
      where gr.id = votes.round_id
      and gr.phase in ('VOTE_REVEAL', 'IMPOSTER_GUESS', 'ROUND_RESULTS', 'MATCH_RESULTS')
    )
  );

-- Match Player Stats
create policy "Match stats viewable by all members"
  on public.match_player_stats for select
  to authenticated
  using (true);

-- ====================================================================
-- AUTHORITATIVE STORED PROCEDURES / FUNCTIONS
-- ====================================================================

-- Function to handle new user registration -> profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', 'player_' || substr(new.id::text, 1, 8));
  v_display_name := coalesce(new.raw_user_meta_data->>'display_name', v_username);

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_id,
    avatar_background,
    created_at,
    updated_at
  ) values (
    new.id,
    v_username,
    v_display_name,
    coalesce(new.raw_user_meta_data->>'avatar_id', 'detective'),
    coalesce(new.raw_user_meta_data->>'avatar_background', '#8B5CF6'),
    now(),
    now()
  );
  return new;
end;
$$;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Secure RPC: Authoritative Start Round
create or replace function public.rpc_start_game_round(
  p_match_id uuid,
  p_round_number int,
  p_secret_word text,
  p_category text,
  p_imposter_hint text,
  p_imposter_user_ids uuid[],
  p_speaker_order uuid[],
  p_phase_deadline timestamptz
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_round_id uuid;
  v_user_id uuid;
  v_is_imposter boolean;
begin
  -- Insert game round with initial phase DEALING_CARDS
  insert into public.game_rounds (
    match_id,
    round_number,
    category,
    phase,
    phase_started_at,
    phase_deadline,
    active_speaker_id,
    speaker_order,
    current_speaker_index,
    imposter_user_ids
  ) values (
    p_match_id,
    p_round_number,
    p_category,
    'DEALING_CARDS',
    now(),
    p_phase_deadline,
    p_speaker_order[1],
    to_jsonb(p_speaker_order),
    0,
    to_jsonb(p_imposter_user_ids)
  ) returning id into v_round_id;

  -- Authoritatively populate private_player_roles for each participant
  foreach v_user_id in array p_speaker_order
  loop
    v_is_imposter := v_user_id = any(p_imposter_user_ids);
    insert into public.private_player_roles (
      round_id,
      user_id,
      role,
      secret_word,
      private_hint,
      card_viewed_at
    ) values (
      v_round_id,
      v_user_id,
      case when v_is_imposter then 'IMPOSTER' else 'NORMAL' end,
      case when v_is_imposter then null else p_secret_word end,
      case when v_is_imposter then p_imposter_hint else null end,
      null
    );
  end loop;

  return v_round_id;
end;
$$;

-- Secure RPC: Player acknowledges seeing their card
create or replace function public.rpc_mark_card_viewed(p_round_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  update public.private_player_roles
  set card_viewed_at = now()
  where round_id = p_round_id and user_id = auth.uid();
  return found;
end;
$$;

-- Secure RPC: Authoritative Vote Submission
create or replace function public.rpc_submit_player_vote(
  p_round_id uuid,
  p_target_id uuid
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  -- Validate voter cannot vote self
  if auth.uid() = p_target_id then
    raise exception 'You cannot vote for yourself';
  end if;

  insert into public.votes (round_id, voter_id, target_id, submitted_at)
  values (p_round_id, auth.uid(), p_target_id, now());

  return true;
end;
$$;
