# Supabase Setup Guide

This guide will help you set up Supabase as the backend for your Todo + Calendar app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Project Name**: `todo-calendar-app` (or your preferred name)
   - **Database Password**: Choose a strong password (save it somewhere safe)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (something like: `https://your-project-ref.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Configure Environment Variables

1. Open the file `.env.local` in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-anon-key
```

## 4. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `database/schema.sql` and paste it into the editor
4. Click **Run** to execute the SQL

This will create:
- The `tasks` table with proper structure
- Indexes for performance
- Row Level Security policies
- Auto-updating timestamp triggers
- Sample data for testing

## 5. Verify Setup

1. In your terminal, restart the dev server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:5174` (or check the terminal for the correct port)
3. Check the footer - you should see **🗄️ Supabase Database** instead of **💾 Local Storage**
4. If still showing localStorage, verify your `.env.local` values and restart again
5. Try creating, editing, and deleting tasks to verify everything works
6. Real-time sync: Open multiple browser tabs to see changes sync automatically

## 6. Database Schema

The `tasks` table structure:

```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  start TIMESTAMPTZ,
  duration_min INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 7. Features Enabled

✅ **Real-time updates**: Changes sync across browser tabs  
✅ **Persistent storage**: Data saved to PostgreSQL database  
✅ **Scalable**: Supports multiple users and large datasets  
✅ **Secure**: Row Level Security enabled  
✅ **Fast**: Optimized with database indexes  

## Troubleshooting

### "Missing Supabase environment variables" Error
- Check that `.env.local` exists and has correct values
- Restart the dev server after changing environment variables
- Make sure variable names start with `VITE_`

### "Failed to load tasks" Error
- Verify your Supabase URL and API key are correct
- Check that the database schema was created successfully
- Ensure your project is not paused (free tier projects pause after 1 week of inactivity)

### Connection Issues
- Check your internet connection
- Verify the Supabase project is active in the dashboard
- Try refreshing the page

## Next Steps

- **Authentication**: Add user authentication for multi-user support
- **Realtime**: Enhance real-time collaboration features  
- **Offline**: Add offline support with sync when back online
- **Performance**: Add caching and pagination for large datasets

---

**Need help?** Check the [Supabase documentation](https://supabase.com/docs) or open an issue in this repository.