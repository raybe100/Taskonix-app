import { useState, useEffect, useCallback } from 'react';
import { supabase, dbTaskToAppTask, appTaskToDbTask, Task, DatabaseTask, isConfigured } from '../lib/supabase';
import { TaskFormData } from '../types';

export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from Supabase
  const loadTasks = useCallback(async () => {
    if (!isConfigured) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const appTasks = data?.map(dbTaskToAppTask) || [];
      setTasks(appTasks);
    } catch (error) {
      console.error('Error loading tasks from Supabase:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      setError(`Failed to load tasks: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Add a new task
  const addTask = useCallback(async (formData: TaskFormData): Promise<Task | null> => {
    if (!isConfigured) {
      setError('Supabase not configured');
      return null;
    }

    try {
      setError(null);
      const newTask = {
        title: formData.title,
        priority: formData.priority,
        start: formData.start || null,
        duration_min: formData.durationMin || null,
        category: formData.category || null,
        description: formData.description || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      const appTask = dbTaskToAppTask(data as DatabaseTask);
      setTasks(prev => [appTask, ...prev]);
      return appTask;
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task');
      return null;
    }
  }, []);

  // Update an existing task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!isConfigured) {
      setError('Supabase not configured');
      return;
    }

    try {
      setError(null);
      const dbUpdates = appTaskToDbTask(updates);
      
      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = dbTaskToAppTask(data as DatabaseTask);
      setTasks(prev => 
        prev.map(task => task.id === id ? updatedTask : task)
      );
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    if (!isConfigured) {
      setError('Supabase not configured');
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  }, []);

  // Suggest time slot for a task (same logic as before)
  const suggestTimeSlot = useCallback((taskId: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.priority === 'High') return false;

    // Find next available time slot
    const now = new Date();
    const workingHours = [9, 10, 11, 14, 15, 16, 17]; // 9 AM - 5 PM, skip lunch
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);
      
      for (const hour of workingHours) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        if (slotStart <= now) continue; // Skip past times
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + (task.durationMin || 30));
        
        // Check if this slot conflicts with existing tasks
        const hasConflict = tasks.some(existingTask => {
          if (!existingTask.start || existingTask.id === task.id) return false;
          
          const existingStart = new Date(existingTask.start);
          const existingEnd = new Date(existingStart);
          existingEnd.setMinutes(existingEnd.getMinutes() + (existingTask.durationMin || 30));
          
          return (slotStart < existingEnd && slotEnd > existingStart);
        });
        
        if (!hasConflict) {
          // Found available slot, update the task
          const suggestedTime = slotStart.toISOString().slice(0, 16);
          updateTask(taskId, { start: suggestedTime });
          return true;
        }
      }
    }
    
    return false;
  }, [tasks, updateTask]);

  // Sync with real-time updates (optional)
  useEffect(() => {
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        console.log('Real-time update:', payload);
        // Reload tasks when changes occur
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    suggestTimeSlot,
    refetch: loadTasks
  };
}