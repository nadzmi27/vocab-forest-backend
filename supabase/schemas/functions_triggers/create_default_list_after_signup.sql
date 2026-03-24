-- Function for creating default list when user 
CREATE OR REPLACE FUNCTION create_default_collection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                  -- runs as DB owner, bypasses RLS
SET search_path = public          -- safety best practice with SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.collections (user_id, name)
  VALUES (NEW.id, 'My List');

  RETURN NEW;
END;
$$;

-- Trigger for creating default list when user signup
CREATE trigger trg_create_default_collection
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_collection()
