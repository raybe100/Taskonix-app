import { useState, useEffect, useCallback } from 'react';
import { Task, TaskFormData, Priority } from '../types';
import { findNextAvailableSlot } from '../lib/schedule';

const STORAGE_KEY = 'todo-calendar-tasks';

/**
 * Custom hook for managing tasks with localStorage persistence
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedTasks = JSON.parse(stored);
        setTasks(parsedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
      }
    }
  }, [tasks, loading]);

  /**
   * Add a new task
   */
  const addTask = useCallback((formData: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: formData.title,
      priority: formData.priority,
      start: formData.start,
      durationMin: formData.durationMin || 30,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  /**
   * Update an existing task
   */
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    );
  }, []);

  /**
   * Delete a task
   */
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  /**
   * Suggest and assign the next available time slot to a task
   * Only works for Low and Medium priority tasks without scheduled time
   */
  const suggestTimeSlot = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    // Only suggest for Low/Medium priority tasks without start time
    if (task.priority === 'High' || task.start) return false;

    const nextSlot = findNextAvailableSlot(tasks, task.durationMin || 30);
    if (!nextSlot) return false;

    updateTask(taskId, { start: nextSlot });
    return true;
  }, [tasks, updateTask]);

  /**
   * Clear all tasks (for testing/reset)
   */
  const clearAllTasks = useCallback(() => {
    setTasks([]);
  }, []);

  /**
   * Import tasks (add to existing tasks)
   */
  const importTasks = useCallback((newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  }, []);

  /**
   * Get tasks filtered by priority
   */
  const getTasksByPriority = useCallback((priority: Priority) => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  /**
   * Get unscheduled tasks (tasks without start time)
   */
  const getUnscheduledTasks = useCallback(() => {
    return tasks.filter(task => !task.start);
  }, [tasks]);

  /**
   * Get scheduled tasks (tasks with start time)
   */
  const getScheduledTasks = useCallback(() => {
    return tasks.filter(task => task.start);
  }, [tasks]);

  return {
    // State
    tasks,
    loading,
    
    // Actions
    addTask,
    updateTask,
    deleteTask,
    suggestTimeSlot,
    clearAllTasks,
    importTasks,
    
    // Selectors
    getTasksByPriority,
    getUnscheduledTasks,
    getScheduledTasks
  };
}