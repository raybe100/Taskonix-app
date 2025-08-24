import { Task } from '../types';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  addMonths,
  subMonths,
  setHours,
  setMinutes
} from 'date-fns';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  dayNumber: number;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  weeks: CalendarWeek[];
  totalDays: number;
}

/**
 * Generate calendar grid for a given month
 */
export function generateCalendarMonth(date: Date, tasks: Task[]): CalendarMonth {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const calendarDays: CalendarDay[] = allDays.map(day => {
    const dayTasks = getTasksForDay(tasks, day);
    
    return {
      date: day,
      isCurrentMonth: isSameMonth(day, date),
      isToday: isToday(day),
      tasks: dayTasks,
      dayNumber: day.getDate()
    };
  });
  
  // Group days into weeks (7 days each)
  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push({
      days: calendarDays.slice(i, i + 7)
    });
  }
  
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    monthName: format(date, 'MMMM yyyy'),
    weeks,
    totalDays: allDays.length
  };
}

/**
 * Get tasks that are scheduled for a specific day
 */
export function getTasksForDay(tasks: Task[], targetDate: Date): Task[] {
  return tasks
    .filter(task => {
      if (!task.start) return false;
      try {
        const taskDate = parseISO(task.start);
        return isSameDay(taskDate, targetDate);
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      // Sort by start time
      if (!a.start || !b.start) return 0;
      return parseISO(a.start).getTime() - parseISO(b.start).getTime();
    });
}

/**
 * Get next/previous month date
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

/**
 * Navigate to specific month/year
 */
export function goToMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Get calendar navigation info
 */
export interface CalendarNavigation {
  currentMonth: string;
  canGoBack: boolean;
  canGoForward: boolean;
  previousMonth: Date;
  nextMonth: Date;
}

export function getCalendarNavigation(date: Date): CalendarNavigation {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Allow navigation 2 years back and 5 years forward
  const minDate = new Date(currentYear - 2, 0, 1);
  const maxDate = new Date(currentYear + 5, 11, 31);
  
  return {
    currentMonth: format(date, 'MMMM yyyy'),
    canGoBack: date > minDate,
    canGoForward: date < maxDate,
    previousMonth: getPreviousMonth(date),
    nextMonth: getNextMonth(date)
  };
}

/**
 * Create a new task for a specific date and time
 */
export function createTaskForDateTime(
  date: Date, 
  hour: number = 9, 
  minute: number = 0
): string {
  const taskDateTime = setMinutes(setHours(new Date(date.getFullYear(), date.getMonth(), date.getDate()), hour), minute);
  return format(taskDateTime, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Get task density for a day (for visual indicators)
 */
export function getTaskDensity(tasks: Task[]): 'low' | 'medium' | 'high' {
  if (tasks.length === 0) return 'low';
  if (tasks.length <= 2) return 'low';
  if (tasks.length <= 4) return 'medium';
  return 'high';
}

/**
 * Get priority summary for a day
 */
export interface DayPrioritySummary {
  high: number;
  medium: number;
  low: number;
  total: number;
  hasHighPriority: boolean;
}

export function getDayPrioritySummary(tasks: Task[]): DayPrioritySummary {
  const summary = tasks.reduce(
    (acc, task) => {
      acc[task.priority.toLowerCase() as 'high' | 'medium' | 'low']++;
      acc.total++;
      return acc;
    },
    { high: 0, medium: 0, low: 0, total: 0 }
  );

  return {
    ...summary,
    hasHighPriority: summary.high > 0
  };
}

/**
 * Format time for calendar display
 */
export function formatCalendarTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'HH:mm');
  } catch {
    return '??:??';
  }
}

/**
 * Check if a day has available time slots
 */
export function hasAvailableSlots(tasks: Task[], date: Date): boolean {
  const dayTasks = getTasksForDay(tasks, date);
  const totalScheduledMinutes = dayTasks.reduce((total, task) => {
    return total + (task.durationMin || 30);
  }, 0);
  
  // Assume 8 working hours (480 minutes) per day
  return totalScheduledMinutes < 480;
}

/**
 * Get color scheme for task priority in calendar
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'High':
      return 'bg-priority-high text-white';
    case 'Medium':
      return 'bg-priority-medium text-white';
    case 'Low':
      return 'bg-priority-low text-white';
    default:
      return 'bg-outline-variant text-on-surface';
  }
}