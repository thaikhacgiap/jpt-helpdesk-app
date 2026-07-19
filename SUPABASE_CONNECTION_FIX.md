# Supabase Connection Fix - RLS Policy Issue

## Problem
You're getting this error:
```
Error creating ticket: new row violates row-level security policy for table 'tickets'
```

## Root Cause
The database schema enabled Row Level Security (RLS) but didn't create the policies to allow public/anonymous access.

## Solution Steps

### Step 1: Fix RLS Policies
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy all content from `fix-rls-policies.sql`
4. Paste into SQL editor
5. Click "Run"

This creates policies that allow all users (including anonymous) to read, create, update, and delete records.

### Step 2: Verify the Connection
After running the SQL, try creating a new ticket in the app:
1. Navigate to `/tickets` page
2. Click "New Ticket" button
3. Fill in the form
4. Click "Save Ticket"
5. You should see success message with ticket ID

### Step 3: Test Queries
In Supabase SQL Editor, test these queries:

```sql
-- Check if staff records exist
SELECT COUNT(*) FROM staff;

-- Check if you can insert a ticket
INSERT INTO tickets (ticket_id, title, description, tt_type, category, priority, sla_time, contract_status, tt_status)
VALUES ('TEST-001', 'Test Ticket', 'Testing connection', 'Bug', 'Payment', 'High', '2h', 'Active', 'New');

-- Check if the ticket was created
SELECT * FROM tickets WHERE ticket_id = 'TEST-001';
```

## Alternative: Disable RLS (Development Only)

If you still have issues, you can temporarily disable RLS for development:

```sql
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assigned DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_following DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_updates DISABLE ROW LEVEL SECURITY;
```

## Troubleshooting

### Still getting RLS errors?
1. Check that all policies were created successfully
2. Go to Supabase Dashboard → Database → tables → tickets → Policies
3. Verify you see policies for SELECT, INSERT, UPDATE, DELETE

### Connection timeout?
1. Check your `.env.local` file has correct URL and key
2. Verify your Supabase project is active in dashboard

### Empty results?
1. Make sure sample data was inserted in the initial schema
2. Check that the staff table has at least one record
3. Go to SQL Editor and run: `SELECT * FROM staff;`

## Next Steps
Once connection is working:
1. Create tickets via the web UI
2. View tickets in the `/tickets` table page
3. Update tickets by clicking ticket ID
4. All data persists to Supabase! 🎉
