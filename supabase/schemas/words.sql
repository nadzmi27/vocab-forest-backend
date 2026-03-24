-- Words
create table public.words (
  word text not null,
  constraint words_pkey1 primary key (word)
) TABLESPACE pg_default;