export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  start?: string;      // ISO datetime, optional
  durationMin?: number; // default 30
  createdAt: string;   // ISO
  category?: string;   // Task category/tag
  description?: string; // Task description/notes
}

export interface TaskFormData {
  title: string;
  priority: Priority;
  start?: string;
  durationMin?: number;
  category?: string;
  description?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface ParsedVoiceInput {
  title: string;
  priority?: Priority;
  start?: string;
  durationMin?: number;
  category?: string;
  description?: string;
}

export interface VoiceCommand {
  type: 'create' | 'edit' | 'delete' | 'complete' | 'search' | 'move';
  taskIdentifier?: string; // Task title/id for editing
  updates?: Partial<ParsedVoiceInput>;
  newDate?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  emoji?: string;
}

// Predefined categories
export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'work', name: 'Work', color: '#C4704A', emoji: '💼' },
  { id: 'personal', name: 'Personal', color: '#4A7C59', emoji: '🏠' },
  { id: 'health', name: 'Health', color: '#B8960F', emoji: '🏃' },
  { id: 'learning', name: 'Learning', color: '#8B7355', emoji: '📚' },
  { id: 'social', name: 'Social', color: '#A08968', emoji: '👥' },
  { id: 'shopping', name: 'Shopping', color: '#B5A07B', emoji: '🛒' }
];