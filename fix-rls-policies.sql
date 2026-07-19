-- ============================================================
-- Fix Row Level Security (RLS) Policies for Supabase
-- This enables anonymous users to read and write data
-- ============================================================

-- ============================================================
-- STAFF Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON staff;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON staff;

CREATE POLICY "Enable read access for all users"
ON staff FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON staff FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON staff FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================
-- CUSTOMERS Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;

CREATE POLICY "Enable read access for all users"
ON customers FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON customers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON customers FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================
-- CONTACTS Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON contacts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contacts;

CREATE POLICY "Enable read access for all users"
ON contacts FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON contacts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON contacts FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================
-- CONTRACTS Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contracts;

CREATE POLICY "Enable read access for all users"
ON contracts FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON contracts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON contracts FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================
-- TICKETS Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tickets;

CREATE POLICY "Enable read access for all users"
ON tickets FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON tickets FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
ON tickets FOR DELETE
USING (true);

-- ============================================================
-- TICKET_ASSIGNED Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON ticket_assigned;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ticket_assigned;

CREATE POLICY "Enable read access for all users"
ON ticket_assigned FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON ticket_assigned FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON ticket_assigned FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
ON ticket_assigned FOR DELETE
USING (true);

-- ============================================================
-- TICKET_FOLLOWING Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON ticket_following;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ticket_following;

CREATE POLICY "Enable read access for all users"
ON ticket_following FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON ticket_following FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON ticket_following FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
ON ticket_following FOR DELETE
USING (true);

-- ============================================================
-- TICKET_UPDATES Table Policies
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON ticket_updates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ticket_updates;

CREATE POLICY "Enable read access for all users"
ON ticket_updates FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON ticket_updates FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON ticket_updates FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
ON ticket_updates FOR DELETE
USING (true);
