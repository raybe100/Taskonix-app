import { Task } from '../types';

/**
 * Export tasks as JSON file
 */
export function exportTasksAsJSON(tasks: Task[]): void {
  const dataStr = JSON.stringify(tasks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export tasks as CSV file
 */
export function exportTasksAsCSV(tasks: Task[]): void {
  const headers = ['Title', 'Priority', 'Category', 'Start Date', 'Duration (min)', 'Description', 'Created At'];
  
  const csvContent = [
    headers.join(','),
    ...tasks.map(task => [
      `"${task.title.replace(/"/g, '""')}"`,
      task.priority,
      task.category || '',
      task.start || '',
      task.durationMin || '',
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.createdAt
    ].join(','))
  ].join('\n');
  
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export tasks in iCal format
 */
export function exportTasksAsICal(tasks: Task[]): void {
  const icalEvents = tasks
    .filter(task => task.start) // Only export scheduled tasks
    .map(task => {
      const startDate = new Date(task.start!);
      const endDate = new Date(startDate.getTime() + (task.durationMin || 30) * 60000);
      
      return [
        'BEGIN:VEVENT',
        `UID:${task.id}@todo-calendar-app`,
        `DTSTART:${formatDateForICal(startDate)}`,
        `DTEND:${formatDateForICal(endDate)}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:${task.description || ''}`,
        `PRIORITY:${task.priority === 'High' ? '1' : task.priority === 'Medium' ? '5' : '9'}`,
        task.category ? `CATEGORIES:${task.category}` : '',
        `CREATED:${formatDateForICal(new Date(task.createdAt))}`,
        'END:VEVENT'
      ].filter(Boolean).join('\n');
    });
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Todo Calendar App//Todo Calendar App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...icalEvents,
    'END:VCALENDAR'
  ].join('\n');
  
  const dataBlob = new Blob([icalContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.ics`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format date for iCal format (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICal(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Import tasks from JSON file
 */
export function importTasksFromJSON(file: File): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const tasks = JSON.parse(content) as Task[];
        
        // Validate task structure
        const validTasks = tasks.filter(task => 
          task.id && task.title && task.priority && task.createdAt
        );
        
        resolve(validTasks);
      } catch (error) {
        reject(new Error('Invalid JSON file format'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Import tasks from CSV file
 */
export function importTasksFromCSV(file: File): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        const tasks: Task[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = parseCSVLine(line);
          
          if (values.length >= 7) {
            const task: Task = {
              id: crypto.randomUUID(),
              title: values[0] || `Imported Task ${i}`,
              priority: (values[1] as 'Low' | 'Medium' | 'High') || 'Medium',
              category: values[2] || undefined,
              start: values[3] || undefined,
              durationMin: values[4] ? parseInt(values[4]) : undefined,
              description: values[5] || undefined,
              createdAt: values[6] || new Date().toISOString()
            };
            
            tasks.push(task);
          }
        }
        
        resolve(tasks);
      } catch (error) {
        reject(new Error('Invalid CSV file format'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  values.push(current.trim());
  
  return values.map(v => v.replace(/^"|"$/g, ''));
}