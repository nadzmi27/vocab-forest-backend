-- Words
create table public.words (
  word text not null,
  created_at timestamp with time zone null default now(),
  constraint words_pkey1 primary key (word)
) TABLESPACE pg_default;