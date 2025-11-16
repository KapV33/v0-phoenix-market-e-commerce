-- Create a function to execute arbitrary SQL (admin only)
-- This is needed for the migration system
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Only allow service role to execute this function
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
