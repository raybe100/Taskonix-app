import { Task } from '../types';

export interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
  createdAt: string;
}

export interface TimeStats {
  totalTime: number;
  tasksCompleted: number;
  averageTaskTime: number;
  productivityScore: number;
  categoryBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, number>;
}

class TimeTracker {
  private activeEntry: TimeEntry | null = null;
  private entries: TimeEntry[] = [];

  constructor() {
    this.loadEntries();
  }

  startTracking(task: Task, description?: string): TimeEntry {
    // Stop any active tracking
    if (this.activeEntry) {
      this.stopTracking();
    }

    const entry: TimeEntry = {
      id: `time-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      startTime: new Date().toISOString(),
      description,
      createdAt: new Date().toISOString()
    };

    this.activeEntry = entry;
    this.entries.push(entry);
    this.saveEntries();
    
    return entry;
  }

  stopTracking(): TimeEntry | null {
    if (!this.activeEntry) return null;

    const now = new Date().toISOString();
    const startTime = new Date(this.activeEntry.startTime);
    const endTime = new Date(now);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    this.activeEntry.endTime = now;
    this.activeEntry.duration = duration;

    const completedEntry = { ...this.activeEntry };
    this.activeEntry = null;
    this.saveEntries();

    return completedEntry;
  }

  getActiveEntry(): TimeEntry | null {
    return this.activeEntry;
  }

  isTracking(): boolean {
    return this.activeEntry !== null;
  }

  getElapsedTime(): number {
    if (!this.activeEntry) return 0;
    
    const startTime = new Date(this.activeEntry.startTime);
    const now = new Date();
    return Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));
  }

  getAllEntries(): TimeEntry[] {
    return [...this.entries];
  }

  getEntriesForTask(taskId: string): TimeEntry[] {
    return this.entries.filter(entry => entry.taskId === taskId);
  }

  getEntriesForDateRange(startDate: Date, endDate: Date): TimeEntry[] {
    return this.entries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  getTotalTimeForTask(taskId: string): number {
    return this.entries
      .filter(entry => entry.taskId === taskId && entry.duration)
      .reduce((total, entry) => total + (entry.duration || 0), 0);
  }

  getTimeStats(startDate?: Date, endDate?: Date): TimeStats {
    let filteredEntries = this.entries.filter(entry => entry.duration);
    
    if (startDate && endDate) {
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    const totalTime = filteredEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
    const tasksCompleted = new Set(filteredEntries.map(entry => entry.taskId)).size;
    const averageTaskTime = tasksCompleted > 0 ? totalTime / tasksCompleted : 0;

    // Simple productivity score based on completed tasks and time efficiency
    const productivityScore = Math.min(100, Math.round(tasksCompleted * 10 + (totalTime > 0 ? 50 : 0)));

    // Category breakdown (assuming we can extract category from task title or description)
    const categoryBreakdown: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      const category = this.extractCategory(entry.taskTitle) || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (entry.duration || 0);
    });

    // Daily breakdown
    const dailyBreakdown: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      const date = new Date(entry.startTime).toDateString();
      dailyBreakdown[date] = (dailyBreakdown[date] || 0) + (entry.duration || 0);
    });

    return {
      totalTime,
      tasksCompleted,
      averageTaskTime,
      productivityScore,
      categoryBreakdown,
      dailyBreakdown
    };
  }

  private extractCategory(taskTitle: string): string | null {
    const lowerTitle = taskTitle.toLowerCase();
    
    if (lowerTitle.includes('meeting') || lowerTitle.includes('call') || lowerTitle.includes('presentation')) {
      return 'Work';
    }
    if (lowerTitle.includes('exercise') || lowerTitle.includes('workout') || lowerTitle.includes('health')) {
      return 'Health';
    }
    if (lowerTitle.includes('learn') || lowerTitle.includes('study') || lowerTitle.includes('course')) {
      return 'Learning';
    }
    if (lowerTitle.includes('shop') || lowerTitle.includes('buy') || lowerTitle.includes('grocery')) {
      return 'Shopping';
    }
    
    return null;
  }

  deleteEntry(entryId: string): void {
    this.entries = this.entries.filter(entry => entry.id !== entryId);
    if (this.activeEntry && this.activeEntry.id === entryId) {
      this.activeEntry = null;
    }
    this.saveEntries();
  }

  private saveEntries(): void {
    localStorage.setItem('todo-time-entries', JSON.stringify({
      entries: this.entries,
      activeEntry: this.activeEntry
    }));
  }

  private loadEntries(): void {
    const stored = localStorage.getItem('todo-time-entries');
    if (stored) {
      const data = JSON.parse(stored);
      this.entries = data.entries || [];
      this.activeEntry = data.activeEntry;
    }
  }
}

export const timeTracker = new TimeTracker();

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function formatTimeRange(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (!endTime) {
    return `${startStr} - ongoing`;
  }
  
  const end = new Date(endTime);
  const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `${startStr} - ${endStr}`;
}