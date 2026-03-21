-- Entries table for all words and it's homograph (different meaning)
create table public.entries (
  uuid uuid not null,
  entry_id text not null,
  word text not null,
  homograph smallint null,
  pos text null,
  stems text[] null,
  shortdef text[] null,
  raw jsonb not null,
  constraint words_pkey primary key (uuid),
  constraint words_entry_id_key unique (entry_id),
  constraint entries_word_fkey foreign KEY (word) references words (word) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists words_word_idx on public.entries using btree (word) TABLESPACE pg_default;

create index IF not exists words_stems_idx on public.entries using gin (stems) TABLESPACE pg_default;

create index IF not exists words_raw_idx on public.entries using gin (raw) TABLESPACE pg_default;

create index IF not exists entries_word_idx on public.entries using btree (word) TABLESPACE pg_default;

create index IF not exists entries_stems_idx on public.entries using gin (stems) TABLESPACE pg_default;