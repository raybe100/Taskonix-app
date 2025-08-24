import { Task, TimeSlot } from '../types';
import { 
  startOfDay, 
  addMinutes, 
  isAfter, 
  isBefore, 
  addDays,
  setHours,
  setMinutes,
  format,
  parseISO 
} from 'date-fns';

const WORK_START_HOUR = 9; // 9:00 AM
const WORK_END_HOUR = 17;   // 5:00 PM
const DEFAULT_SLOT_DURATION = 30; // minutes

/**
 * Find the next available 30-minute time slot for scheduling a task
 * Searches today first (9:00-17:00), then tomorrow if today is full
 */
export function findNextAvailableSlot(
  tasks: Task[],
  durationMin: number = DEFAULT_SLOT_DURATION
): string | null {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  
  // Try today first if we still have time
  const todaySlot = findSlotInDay(tasks, today, durationMin, now);
  if (todaySlot) {
    return todaySlot;
  }
  
  // Try tomorrow
  return findSlotInDay(tasks, tomorrow, durationMin);
}

/**
 * Find available slot within a specific day
 */
function findSlotInDay(
  tasks: Task[],
  day: Date,
  durationMin: number,
  earliestTime?: Date
): string | null {
  const workStart = setMinutes(setHours(day, WORK_START_HOUR), 0);
  const workEnd = setMinutes(setHours(day, WORK_END_HOUR), 0);
  
  // Use either work start or current time, whichever is later
  const searchStart = earliestTime && isAfter(earliestTime, workStart) 
    ? earliestTime 
    : workStart;
  
  // Get scheduled tasks for this day
  const dayTasks = getTasksForDay(tasks, day);
  const occupiedSlots = dayTasks
    .filter(task => task.start && task.durationMin)
    .map(task => ({
      start: parseISO(task.start!),
      end: addMinutes(parseISO(task.start!), task.durationMin!)
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Try 30-minute intervals
  let currentTime = searchStart;
  
  while (isBefore(addMinutes(currentTime, durationMin), workEnd)) {
    const proposedSlot = {
      start: currentTime,
      end: addMinutes(currentTime, durationMin)
    };
    
    // Check if this slot conflicts with existing tasks
    const hasConflict = occupiedSlots.some(occupied => 
      slotsOverlap(proposedSlot, occupied)
    );
    
    if (!hasConflict) {
      return format(currentTime, "yyyy-MM-dd'T'HH:mm");
    }
    
    currentTime = addMinutes(currentTime, 30);
  }
  
  return null;
}

/**
 * Get tasks scheduled for a specific day
 */
function getTasksForDay(tasks: Task[], day: Date): Task[] {
  const dayStart = startOfDay(day);
  const dayEnd = addMinutes(dayStart, 24 * 60 - 1);
  
  return tasks.filter(task => {
    if (!task.start) return false;
    const taskStart = parseISO(task.start);
    return isAfter(taskStart, dayStart) && isBefore(taskStart, dayEnd);
  });
}

/**
 * Check if two time slots overlap
 */
function slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return isBefore(slot1.start, slot2.end) && isAfter(slot1.end, slot2.start);
}

/**
 * Group tasks by day for display
 */
export function groupTasksByDay(tasks: Task[]): { 
  today: Task[], 
  tomorrow: Task[], 
  later: Task[] 
} {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  
  const result = {
    today: [] as Task[],
    tomorrow: [] as Task[],
    later: [] as Task[]
  };
  
  tasks.forEach(task => {
    if (!task.start) {
      // Unscheduled tasks go to today by default
      result.today.push(task);
      return;
    }
    
    const taskStart = parseISO(task.start);
    
    if (isAfter(taskStart, today) && isBefore(taskStart, tomorrow)) {
      result.today.push(task);
    } else if (isAfter(taskStart, tomorrow) && isBefore(taskStart, dayAfterTomorrow)) {
      result.tomorrow.push(task);
    } else {
      result.later.push(task);
    }
  });
  
  // Sort within each group
  const sortTasks = (tasks: Task[]) => 
    tasks.sort((a, b) => {
      // Unscheduled first, then by start time
      if (!a.start && !b.start) return 0;
      if (!a.start) return -1;
      if (!b.start) return 1;
      return parseISO(a.start).getTime() - parseISO(b.start).getTime();
    });
  
  result.today = sortTasks(result.today);
  result.tomorrow = sortTasks(result.tomorrow);
  result.later = sortTasks(result.later);
  
  return result;
}