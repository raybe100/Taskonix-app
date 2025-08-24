import { useState, useCallback } from 'react';
import { Task, TaskFormData } from '../types';
import { format, parseISO } from 'date-fns';

export interface UseCalendarProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (taskData: TaskFormData) => void;
}

export interface UseCalendarReturn {
  selectedDate: Date | null;
  selectedTask: Task | null;
  isTaskModalOpen: boolean;
  isDatePickerOpen: boolean;
  
  // Actions
  selectDate: (date: Date) => void;
  selectTask: (task: Task) => void;
  clearSelection: () => void;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  openDatePicker: () => void;
  closeDatePicker: () => void;
  
  // Task operations
  handleDateClick: (date: Date) => void;
  handleTaskClick: (task: Task) => void;
  handleTaskDrop: (taskId: string, targetDate: Date) => void;
  handleQuickTaskCreate: (date: Date, title?: string) => void;
  
  // Utility
  getTasksForDate: (date: Date) => Task[];
}

export function useCalendar({ tasks, onTaskUpdate, onTaskCreate }: UseCalendarProps): UseCalendarReturn {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTask(null);
  }, []);
  
  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    if (task.start) {
      try {
        setSelectedDate(parseISO(task.start));
      } catch {
        setSelectedDate(null);
      }
    }
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedDate(null);
    setSelectedTask(null);
  }, []);
  
  const openTaskModal = useCallback(() => {
    setIsTaskModalOpen(true);
  }, []);
  
  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  }, []);
  
  const openDatePicker = useCallback(() => {
    setIsDatePickerOpen(true);
  }, []);
  
  const closeDatePicker = useCallback(() => {
    setIsDatePickerOpen(false);
  }, []);
  
  const handleDateClick = useCallback((date: Date) => {
    selectDate(date);
    // Could trigger a modal or quick add functionality
  }, [selectDate]);
  
  const handleTaskClick = useCallback((task: Task) => {
    selectTask(task);
    openTaskModal();
  }, [selectTask, openTaskModal]);
  
  const handleTaskDrop = useCallback((taskId: string, targetDate: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Preserve time if task was already scheduled, otherwise use 9 AM
    let newDateTime: string;
    if (task.start) {
      try {
        const existingDate = parseISO(task.start);
        const newDate = new Date(targetDate);
        newDate.setHours(existingDate.getHours(), existingDate.getMinutes());
        newDateTime = format(newDate, "yyyy-MM-dd'T'HH:mm");
      } catch {
        newDateTime = format(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 9, 0), "yyyy-MM-dd'T'HH:mm");
      }
    } else {
      newDateTime = format(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 9, 0), "yyyy-MM-dd'T'HH:mm");
    }
    
    onTaskUpdate(taskId, { start: newDateTime });
  }, [tasks, onTaskUpdate]);
  
  const handleQuickTaskCreate = useCallback((date: Date, title: string = 'New Task') => {
    const newTaskDateTime = format(
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0), 
      "yyyy-MM-dd'T'HH:mm"
    );
    
    onTaskCreate({
      title,
      priority: 'Medium',
      start: newTaskDateTime,
      durationMin: 30
    });
  }, [onTaskCreate]);
  
  const getTasksForDate = useCallback((date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.start) return false;
      try {
        const taskDate = parseISO(task.start);
        return format(taskDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      } catch {
        return false;
      }
    });
  }, [tasks]);
  
  return {
    selectedDate,
    selectedTask,
    isTaskModalOpen,
    isDatePickerOpen,
    
    selectDate,
    selectTask,
    clearSelection,
    openTaskModal,
    closeTaskModal,
    openDatePicker,
    closeDatePicker,
    
    handleDateClick,
    handleTaskClick,
    handleTaskDrop,
    handleQuickTaskCreate,
    
    getTasksForDate
  };
}