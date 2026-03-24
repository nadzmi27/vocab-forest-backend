-- User's collections
CREATE TYPE sort_mode_enum AS ENUM ('manual', 'alphabetical');

create table public.collections (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  description text null,
  sort_mode   sort_mode_enum NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone null default now(),
  constraint collections_pkey primary key (id),
  constraint collections_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists collections_user_id_idx on public.collections using btree (user_id) TABLESPACE pg_default;
