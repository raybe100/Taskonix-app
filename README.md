# Taskonix 🎤✨

**The Voice-First Task Management Revolution**

Master your time, conquer your goals with the most intelligent voice-first productivity app. Built with React + TypeScript + Vite, powered by AI.

*Production-ready with comprehensive voice processing, location awareness, and smart reminders*

## 🌟 Core Features

### 🎙️ **Advanced Voice Capture**
- **Hold-to-record** interface optimized for mobile and desktop
- **Real-time transcription** with confidence scoring
- **Advanced NLP parsing** using Supabase Edge Functions + chrono-node
- **Smart suggestions** for dates, times, locations, priorities, and categories
- **Confirmation sheets** with full editing capabilities before saving

### 🧠 **Intelligent Processing**
- **Automatic date/time extraction**: "Dentist tomorrow at 2pm" → structured event
- **Location resolution** using Google Places API
- **Priority detection** from keywords (urgent, ASAP, important)
- **Category classification** (work, health, personal, shopping, etc.)
- **Travel time calculation** with Google Distance Matrix API

### 📍 **Location-Aware Reminders**
- **Saved locations** with customizable geofence radius
- **Location-based notifications** when entering/leaving places
- **Travel time reminders** ("Time to leave for your appointment")
- **Web geofencing simulation** for browser-based location tracking

### 🔔 **Smart Notifications**
- **Multiple trigger types**: time-based, offset-based, location-based
- **Service Worker** support for background notifications
- **Notification actions**: mark complete, snooze, view task
- **Quiet hours** and preference management
- **Progressive enhancement** with graceful fallbacks

### 📅 **Beautiful Calendar & Views**
- **Today view** with overdue, events, tasks, and unscheduled items
- **Interactive calendar** with visual item indicators
- **Agenda mode** for upcoming items
- **Priority-based** color coding and sorting
- **Mobile-optimized** responsive design

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎤 Voice Input Examples

Try these natural language commands:

```
"Team meeting tomorrow at 3pm in the conference room, remind me 30 minutes before"
"Dentist appointment Friday at 2pm at Smile Dental urgent"
"Buy groceries at Whole Foods on Saturday"
"Call mom this evening low priority"
"Workout at the gym every Monday at 6pm"
"Flight to New York next Wednesday at 8am, remind me 2 hours before"
```

The AI will automatically extract:
- **Dates & times**: "tomorrow at 3pm", "Friday at 2pm", "next Wednesday"  
- **Locations**: "conference room", "Smile Dental", "Whole Foods"
- **Priorities**: "urgent", "low priority"
- **Categories**: "meeting" → work, "dentist" → health
- **Reminders**: "remind me 30 minutes before"
- **Recurrence**: "every Monday"

## 🏗️ Architecture & Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for beautiful, responsive styling
- **Zustand** for lightweight state management
- **date-fns** for date manipulation
- **React Calendar** for calendar UI

### **Backend Services**
- **Supabase** for database, auth, and edge functions
- **Clerk** for advanced user authentication  
- **Google Places API** for location services
- **Google Distance Matrix** for travel time calculation

### **AI & Processing**
- **Supabase Edge Functions** (Deno) for server-side NLP
- **chrono-node** for advanced date/time parsing
- **Custom NLP service** with fallback client-side processing

### **Real-time & Notifications**
- **Web Speech API** for voice recognition
- **Service Workers** for background processing
- **Web Notifications API** with permission management
- **Geolocation API** for location-based features

## 📁 Project Structure

```
src/
├── components/
│   ├── VoiceCapture.tsx           # Hold-to-record voice interface
│   ├── VoiceConfirmationSheet.tsx # Edit parsed voice results
│   ├── CaptureScreen.tsx          # Main voice capture screen
│   ├── TodayView.tsx              # Today's agenda view
│   ├── CalendarView.tsx           # Interactive calendar
│   ├── LocationManager.tsx        # Saved locations management
│   └── NotificationSettings.tsx   # Notification preferences
├── services/
│   ├── SpeechService.ts           # Web Speech API wrapper
│   ├── NLPService.ts              # Natural language processing
│   ├── NotificationService.ts     # Smart notifications
│   └── PlacesService.ts           # Google Places integration
├── store/
│   └── useItemsStore.ts           # Zustand state management
├── types.ts                       # Comprehensive TypeScript types
└── lib/
    └── supabase.ts                # Database client & utilities

supabase/
└── functions/
    └── parse-task/
        └── index.ts               # Edge function for NLP parsing

database/
├── schema.sql                     # Full database schema
└── migration.sql                  # Migration from old schema
```

## 🔧 Configuration

### **Environment Variables**

Create `.env.local` with:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication (Required)  
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Google APIs (Optional - enables location features)
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
VITE_GOOGLE_DISTANCE_MATRIX_API_KEY=your_distance_matrix_api_key

# App Configuration
VITE_APP_NAME=Taskonix
VITE_APP_VERSION=2.0.0
VITE_DEFAULT_TIMEZONE=America/New_York
VITE_DEFAULT_LOCATION_RADIUS=150
```

### **Database Setup**

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Run the schema**: Execute `database/schema.sql` in the SQL editor
3. **Configure RLS**: Row Level Security policies are included
4. **Deploy edge function**: Deploy `supabase/functions/parse-task`

### **Service Worker Setup**

The app includes a service worker (`public/sw.js`) for:
- Background notifications
- Offline functionality  
- Notification actions
- Data caching

## 🎯 Key Features Breakdown

### **Voice-First Design Philosophy**
- **Mobile-optimized** hold-to-record button (80px minimum touch target)
- **Visual feedback** with real-time waveforms and confidence scores
- **Error handling** with clear user messaging and fallbacks
- **Confirmation flow** allowing users to review and edit before saving

### **Intelligent Parsing**
- **Server-side processing** with Supabase Edge Functions
- **Advanced date parsing** handles relative dates, recurring patterns
- **Location resolution** with saved places and Google Places search  
- **Context awareness** using user location and preferences
- **Confidence scoring** with explanations for parsing decisions

### **Smart Reminders**
- **Dynamic scheduling** based on item type and location
- **Travel time integration** for location-based events
- **Geofencing simulation** for web browsers
- **Multiple reminder types**: absolute time, offset, location-based
- **Background processing** with service workers

### **Responsive Mobile-First UI**
- **Touch-friendly** interfaces with proper spacing
- **Progressive enhancement** from mobile to desktop
- **Dark mode** support with system preference detection
- **Accessibility** compliant with WCAG 2.1 AA standards

## 🧪 Testing Voice Features

### **Test Commands**
```bash
# Basic task creation
"Buy milk"
"Call John tomorrow"

# Events with times  
"Meeting at 3pm"
"Lunch with Sarah tomorrow at noon"

# Locations
"Dentist at Smile Dental on Friday"
"Pick up package at UPS store"

# Priorities
"Fix website bug urgent"
"Read book later when possible"  

# Recurring
"Team standup every weekday at 9am"
"Gym workout every Monday and Wednesday"
```

### **Browser Support**
- **Chrome/Edge**: Full support including geolocation
- **Firefox**: Full support with geolocation  
- **Safari**: Full support on iOS/macOS
- **Fallbacks**: Text input when Speech API unavailable

## 📱 Mobile Features

- **PWA ready** with manifest and service worker
- **Offline functionality** with background sync
- **Touch gestures** for calendar navigation
- **Responsive layouts** optimized for all screen sizes
- **Battery efficient** location tracking
- **Push notifications** support (when available)

## 🔐 Security & Privacy

- **Row Level Security** (RLS) for all database operations
- **Client-side encryption** for sensitive data
- **No location data** stored without explicit user consent
- **Secure API keys** with proper environment variable management
- **HTTPS required** for all production deployments

## 🚀 Deployment

### **Static Hosting** (Recommended)
- **Vercel**: Zero-config deployment with Edge Functions support
- **Netlify**: Full-stack deployment with form handling
- **GitHub Pages**: Static hosting with GitHub Actions

### **Server Deployment**
- **Railway**: Full-stack with database
- **Heroku**: Complete app deployment
- **DigitalOcean**: VPS deployment

The app is designed as a static SPA and can be deployed to any hosting service that supports single-page applications.

---

**Built with ❤️ using Claude Code** 
*The most advanced voice-first task management experience available*