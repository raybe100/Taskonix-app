// Taskonix Types - Voice-First Task Management
// Updated to match comprehensive database schema

// Legacy priority type for backward compatibility
export type Priority = 'Low' | 'Medium' | 'High';

// New priority system (1-5 scale)
export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

// Core enums matching database
export type ItemType = 'task' | 'event';
export type ItemStatus = 'pending' | 'scheduled' | 'done' | 'cancelled';
export type TriggerType = 'datetime' | 'offset' | 'geofence';

// Main Item interface (replaces old Task)
export interface Item {
  id: string;
  clerk_user_id: string;
  title: string;
  notes?: string;
  type: ItemType;
  
  // Time fields
  start_at?: string; // ISO timestamp
  end_at?: string;
  all_day?: boolean;
  due_at?: string;
  timezone: string;
  
  // Location fields
  location_name?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  
  // Metadata
  recurrence_rrule?: string; // RFC5545 RRULE
  priority: PriorityLevel;
  tags: string[];
  category?: string;
  
  // System fields
  ai_suggestions: Record<string, any>;
  status: ItemStatus;
  completed_at?: string;
  
  // Audit
  created_at: string;
  updated_at: string;
  
  // Migration tracking
  migrated_from_task_id?: string;
  
  // Computed fields (from joins)
  reminders?: Reminder[];
}

// Reminder interface
export interface Reminder {
  id: string;
  item_id: string;
  trigger_type: TriggerType;
  trigger_at?: string;
  offset_minutes?: number;
  lead_time_minutes?: number;
  channel: string;
  message?: string;
  fired_at?: string;
  acknowledged_at?: string;
  created_at: string;
}

// Location interface
export interface Location {
  id: string;
  clerk_user_id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  address?: string;
  place_id?: string;
  created_at: string;
}

// User profile interface
export interface Profile {
  id: string;
  clerk_user_id: string;
  full_name?: string;
  email?: string;
  timezone: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Device interface
export interface Device {
  id: string;
  clerk_user_id: string;
  device_token?: string;
  platform: string;
  os_version?: string;
  app_version?: string;
  location_permission: boolean;
  notification_permission: boolean;
  geofencing_supported: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

// Form data interfaces
export interface ItemFormData {
  title: string;
  notes?: string;
  type: ItemType;
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
  due_at?: string;
  timezone?: string;
  location_name?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  recurrence_rrule?: string;
  priority: PriorityLevel;
  tags?: string[];
  category?: string;
}

// Backward compatibility - maps old TaskFormData
export interface TaskFormData {
  title: string;
  priority: Priority;
  start?: string;
  durationMin?: number;
  category?: string;
  description?: string;
}

// Voice processing interfaces
export interface ParsedVoiceInput {
  title: string;
  notes?: string;
  type?: ItemType;
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
  due_at?: string;
  location_name?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  priority?: PriorityLevel;
  tags?: string[];
  category?: string;
  confidence?: number;
  raw_text?: string;
  
  // Legacy fields for backward compatibility
  start?: string;
  durationMin?: number;
}

// Voice command interface
export interface VoiceCommand {
  type: 'create' | 'edit' | 'delete' | 'complete' | 'search' | 'move' | 'remind';
  item_identifier?: string;
  taskIdentifier?: string; // Legacy field
  updates?: Partial<ParsedVoiceInput>;
  new_date?: string;
  newDate?: string; // Legacy field
  reminder_settings?: Partial<Reminder>;
}

// AI suggestions from edge function
export interface AISuggestions {
  suggested_reminders?: Partial<Reminder>[];
  suggested_location?: Partial<Location>;
  suggested_category?: string;
  suggested_tags?: string[];
  travel_time_minutes?: number;
  confidence_score?: number;
  parsing_notes?: string[];
}

// Legacy Task interface for backward compatibility
export interface Task {
  id: string;
  title: string;
  priority: Priority;
  start?: string;
  durationMin?: number;
  createdAt: string;
  category?: string;
  description?: string;
}

// Time slot interface
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  item_id?: string;
}

// Calendar view types
export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
  items: Item[];
}

// Today view data
export interface TodayView {
  overdue: Item[];
  due_today: Item[];
  scheduled_today: Item[];
  no_date: Item[];
  upcoming_reminders: Reminder[];
}

// Category interface
export interface ItemCategory {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  description?: string;
}

// Legacy TaskCategory alias for backward compatibility
export type TaskCategory = ItemCategory;

// Predefined categories
export const DEFAULT_CATEGORIES: ItemCategory[] = [
  { id: 'work', name: 'Work', color: '#C4704A', emoji: '💼', description: 'Work tasks and meetings' },
  { id: 'personal', name: 'Personal', color: '#4A7C59', emoji: '🏠', description: 'Personal tasks and errands' },
  { id: 'health', name: 'Health', color: '#B8960F', emoji: '🏃', description: 'Health, fitness, and medical' },
  { id: 'learning', name: 'Learning', color: '#8B7355', emoji: '📚', description: 'Education and skill building' },
  { id: 'social', name: 'Social', color: '#A08968', emoji: '👥', description: 'Social events and relationships' },
  { id: 'shopping', name: 'Shopping', color: '#B5A07B', emoji: '🛒', description: 'Shopping and purchases' },
  { id: 'finance', name: 'Finance', color: '#8A9A5B', emoji: '💰', description: 'Financial tasks and planning' },
  { id: 'travel', name: 'Travel', color: '#7B8CDE', emoji: '✈️', description: 'Travel and transportation' }
];

// Priority level mappings
export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  1: 'Very Low',
  2: 'Low', 
  3: 'Medium',
  4: 'High',
  5: 'Critical'
};

// Convert legacy priority to new system
export function legacyPriorityToPriorityLevel(priority: Priority): PriorityLevel {
  switch (priority) {
    case 'Low': return 2;
    case 'Medium': return 3;
    case 'High': return 4;
    default: return 3;
  }
}

// Convert new priority to legacy
export function priorityLevelToLegacyPriority(level: PriorityLevel): Priority {
  switch (level) {
    case 1:
    case 2: return 'Low';
    case 3: return 'Medium';
    case 4:
    case 5: return 'High';
    default: return 'Medium';
  }
}

// Notification preferences
export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  default_lead_time: number; // minutes
  location_reminders: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string;
}

// Speech recognition types
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  is_final: boolean;
}

export interface SpeechRecognitionOptions {
  continuous: boolean;
  interim_results: boolean;
  language: string;
  max_alternatives: number;
}

// Global speech recognition interfaces for browser compatibility
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  
  class SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: any;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    serviceURI: string;
    
    start(): void;
    stop(): void;
    abort(): void;
    
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
}

// Notification types
export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: number;
  actions?: NotificationAction[];
}

declare global {
  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }

  interface NotificationEvent extends Event {
    readonly action: string;
    readonly notification: Notification;
  }
}

// Google Places types
export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

// Distance Matrix types
export interface DistanceMatrixResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  status: string;
}

// Export additional utility types
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };