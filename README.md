# Taskonix

Master your time, conquer your goals - A powerful SaaS productivity app built with React + TypeScript + Vite.

*Deployment ready with TypeScript fixes and Supabase backend*

## Features

✅ **Task Management**
- Add tasks with title, priority (Low/Medium/High), optional start time, and duration
- Hybrid storage: Uses Supabase database when configured, falls back to localStorage
- User authentication with Clerk for secure multi-device sync
- Delete tasks with one click

✅ **Smart Scheduling** 
- "Suggest time" button for Low/Medium priority tasks finds next available 30-min slot
- Searches today (9:00-17:00) first, then tomorrow if today is full
- High priority tasks are not auto-scheduled (manual control)

✅ **Voice Input**
- Click mic button to dictate tasks using Web Speech API
- Basic NLP parsing: "tomorrow 3pm low 45m" → extracts fields automatically
- Gracefully degrades if Speech API unavailable

✅ **Calendar View**
- Simple list grouped by Today/Tomorrow/Later
- Tasks sorted by start time within each group
- Unscheduled tasks appear in Today section

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Voice Input Examples

- "Meeting with team tomorrow 3pm high 60m"
- "Call dentist low" 
- "Review code medium today 2:30pm"
- "Grocery shopping 45m"

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **date-fns** for date utilities
- **Web Speech API** for voice input
- **Supabase** for database (with localStorage fallback)
- **Clerk** for authentication
- **Stripe** for subscription management

## Project Structure

```
src/
├── components/
│   ├── TaskForm.tsx      # Form with voice input
│   └── CalendarList.tsx  # Task display by day
├── hooks/
│   └── useTasks.ts       # Task state & localStorage
├── lib/
│   ├── schedule.ts       # Time slot finding logic  
│   └── nlp.ts           # Voice input parsing
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main layout
└── main.tsx             # React entry point
```

## Build for Production

```bash
npm run build
npm run preview
```

The app is fully client-side and can be deployed to any static hosting service. It features hybrid storage that automatically falls back to localStorage if Supabase is not configured.

## Configuration

### Required
- **Clerk Authentication**: Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`

### Optional
- **Supabase Database**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for cloud storage
- **Stripe Payments**: Set `VITE_STRIPE_PUBLISHABLE_KEY` for subscription features

Without Supabase configuration, the app will use localStorage for data persistence.