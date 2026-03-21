-- User words
create table public.user_words (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  word text not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint user_words_pkey primary key (id),
  constraint user_words_user_id_key unique (user_id),
  constraint user_words_user_id_word_key unique (user_id, word),
  constraint user_words_word_key unique (word),
  constraint user_words_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint user_words_word_fkey foreign KEY (word) references words (word) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_words_user_id_idx on public.user_words using btree (user_id) TABLESPACE pg_default;
