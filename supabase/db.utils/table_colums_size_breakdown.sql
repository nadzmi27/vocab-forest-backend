-- Create function to return table of `table_name`, `column_name`, `total_size`
-- Used to check the size of each column
-- For optimisation purposes so I can check manually
CREATE OR REPLACE FUNCTION column_sizes_all_tables()
RETURNS TABLE(table_name text, column_name text, total_size text)
LANGUAGE plpgsql AS $$
DECLARE
  tbl text;
BEGIN
  FOR tbl INCREATE OR REPLACE FUNCTION column_sizes_all_tables()
RETURNS TABLE(table_name text, column_name text, total_size text)
LANGUAGE plpgsql AS $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  LOOP
    RETURN QUERY EXECUTE format($q$
      SELECT
        %L AS table_name,
        key AS column_name,
        pg_size_pretty(sum(pg_column_size(value))::bigint) AS total_size
      FROM %I, json_each(row_to_json(%I))
      GROUP BY key
      ORDER BY sum(pg_column_size(value)) DESC
    $q$, tbl, tbl, tbl);
  END LOOP;
END;
$$;
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  LOOP
    RETURN QUERY EXECUTE format($q$
      SELECT
        %L AS table_name,
        key AS column_name,
        pg_size_pretty(sum(pg_column_size(value))::bigint) AS total_size
      FROM %I, json_each(row_to_json(%I))
      GROUP BY key
      ORDER BY sum(pg_column_size(value)) DESC
    $q$, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- Call to check:
SELECT * FROM column_sizes_all_tables();