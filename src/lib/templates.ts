import { Task, TaskFormData, Priority } from '../types';

export interface TaskTemplate {
  id: string;
  name: string;
  category: string;
  emoji: string;
  tasks: TaskFormData[];
}

export const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'daily-routine',
    name: 'Daily Routine',
    category: 'personal',
    emoji: '🌅',
    tasks: [
      {
        title: 'Morning Exercise',
        priority: 'Medium' as Priority,
        durationMin: 30,
        category: 'health',
        description: 'Start the day with physical activity'
      },
      {
        title: 'Check Emails',
        priority: 'Medium' as Priority,
        durationMin: 15,
        category: 'work',
        description: 'Review and respond to important emails'
      },
      {
        title: 'Plan Daily Tasks',
        priority: 'High' as Priority,
        durationMin: 10,
        category: 'work',
        description: 'Review and prioritize today\'s agenda'
      }
    ]
  },
  {
    id: 'meeting-prep',
    name: 'Meeting Preparation',
    category: 'work',
    emoji: '📋',
    tasks: [
      {
        title: 'Review Meeting Agenda',
        priority: 'High' as Priority,
        durationMin: 15,
        category: 'work',
        description: 'Go through agenda points and prepare notes'
      },
      {
        title: 'Prepare Presentation Materials',
        priority: 'High' as Priority,
        durationMin: 30,
        category: 'work',
        description: 'Create or update slides and documents'
      },
      {
        title: 'Test Technology Setup',
        priority: 'Medium' as Priority,
        durationMin: 5,
        category: 'work',
        description: 'Check video/audio and screen sharing'
      }
    ]
  },
  {
    id: 'project-kickoff',
    name: 'Project Kickoff',
    category: 'work',
    emoji: '🚀',
    tasks: [
      {
        title: 'Define Project Scope',
        priority: 'High' as Priority,
        durationMin: 60,
        category: 'work',
        description: 'Outline objectives, deliverables, and timeline'
      },
      {
        title: 'Identify Stakeholders',
        priority: 'High' as Priority,
        durationMin: 30,
        category: 'work',
        description: 'List all project participants and roles'
      },
      {
        title: 'Set Up Project Tools',
        priority: 'Medium' as Priority,
        durationMin: 45,
        category: 'work',
        description: 'Configure collaboration and tracking tools'
      },
      {
        title: 'Schedule Kickoff Meeting',
        priority: 'Medium' as Priority,
        durationMin: 15,
        category: 'work',
        description: 'Coordinate with team for initial meeting'
      }
    ]
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    category: 'personal',
    emoji: '📊',
    tasks: [
      {
        title: 'Review Completed Tasks',
        priority: 'Medium' as Priority,
        durationMin: 20,
        category: 'personal',
        description: 'Analyze what was accomplished this week'
      },
      {
        title: 'Plan Next Week Priorities',
        priority: 'High' as Priority,
        durationMin: 30,
        category: 'personal',
        description: 'Set goals and priorities for upcoming week'
      },
      {
        title: 'Update Personal Goals',
        priority: 'Low' as Priority,
        durationMin: 15,
        category: 'personal',
        description: 'Review progress on long-term objectives'
      }
    ]
  },
  {
    id: 'health-checkup',
    name: 'Health & Wellness',
    category: 'health',
    emoji: '🏥',
    tasks: [
      {
        title: 'Schedule Doctor Appointment',
        priority: 'Medium' as Priority,
        durationMin: 10,
        category: 'health',
        description: 'Book regular health checkup'
      },
      {
        title: 'Update Health Records',
        priority: 'Low' as Priority,
        durationMin: 15,
        category: 'health',
        description: 'Record recent health metrics and changes'
      },
      {
        title: 'Review Insurance Coverage',
        priority: 'Low' as Priority,
        durationMin: 30,
        category: 'health',
        description: 'Check policy details and coverage options'
      }
    ]
  }
];

export function applyTemplate(template: TaskTemplate, baseDate?: Date): TaskFormData[] {
  const startDate = baseDate || new Date();
  
  return template.tasks.map((task, index) => ({
    ...task,
    // Stagger tasks throughout the day if no specific time is set
    start: new Date(startDate.getTime() + (index * 60 * 60 * 1000)).toISOString()
  }));
}

export function createCustomTemplate(name: string, tasks: Task[]): TaskTemplate {
  return {
    id: `custom-${Date.now()}`,
    name,
    category: 'personal',
    emoji: '📝',
    tasks: tasks.map(task => ({
      title: task.title,
      priority: task.priority,
      durationMin: task.durationMin,
      category: task.category,
      description: task.description
    }))
  };
}

export function saveCustomTemplate(template: TaskTemplate): void {
  const customTemplates = getCustomTemplates();
  customTemplates.push(template);
  localStorage.setItem('todo-custom-templates', JSON.stringify(customTemplates));
}

export function getCustomTemplates(): TaskTemplate[] {
  const stored = localStorage.getItem('todo-custom-templates');
  return stored ? JSON.parse(stored) : [];
}

export function getAllTemplates(): TaskTemplate[] {
  return [...DEFAULT_TEMPLATES, ...getCustomTemplates()];
}