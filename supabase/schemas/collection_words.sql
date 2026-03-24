-- Words inside the collection
create table public.collection_words (
  collection_id uuid not null,
  user_word_id uuid not null,
  sort_order smallint not null default '0'::smallint,
  added_at timestamp with time zone null default now(),
  constraint collection_words_pkey primary key (collection_id, user_word_id),
  constraint collection_words_collection_id_fkey foreign KEY (collection_id) references collections (id) on delete CASCADE,
  constraint collection_words_user_word_id_fkey foreign KEY (user_word_id) references user_words (id) on delete CASCADE
) TABLESPACE pg_default;