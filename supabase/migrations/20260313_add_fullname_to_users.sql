BEGIN;

-- Add full_name column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Ensure we have a way to auto-generate usernames if not provided
-- This function can be used by an insert trigger or just as a utility
CREATE OR REPLACE FUNCTION generate_unique_username(email_val TEXT) 
RETURNS TEXT AS $$
DECLARE
    new_username TEXT;
    base_username TEXT;
    counter INT := 0;
BEGIN
    base_username := split_part(email_val, '@', 1);
    new_username := base_username;
    
    WHILE EXISTS (SELECT 1 FROM users WHERE username = new_username) LOOP
        counter := counter + 1;
        new_username := base_username || counter::TEXT;
    END LOOP;
    
    RETURN new_username;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Rollback:
-- ALTER TABLE users DROP COLUMN IF EXISTS full_name;
-- DROP FUNCTION IF EXISTS generate_unique_username;
