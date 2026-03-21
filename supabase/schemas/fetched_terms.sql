-- To check if the term has already been fetched or not
create table public.fetched_terms (
  term text not null,
  exists boolean not null,
  headword text null,
  fetched_at timestamp with time zone null default now(),
  constraint fetched_terms_pkey primary key (term),
  constraint fetched_terms_headword_fkey foreign KEY (headword) references words (word) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;