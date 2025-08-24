import { Priority, ParsedVoiceInput, VoiceCommand, Task } from '../types';
import { 
  format, 
  addDays, 
  setHours, 
  setMinutes, 
  startOfDay,
  nextDay,
  addWeeks,
  getDay,
  setDay,
  parse,
  isValid
} from 'date-fns';

export interface VoiceSuggestion {
  type: 'task' | 'time' | 'priority' | 'category';
  suggestion: string;
  confidence: number;
  reasoning: string;
}

export function generateVoiceSuggestions(tasks: Task[], currentInput: string): VoiceSuggestion[] {
  const suggestions: VoiceSuggestion[] = [];
  const lowerInput = currentInput.toLowerCase().trim();
  
  if (lowerInput === '') return suggestions;

  // Suggest similar existing tasks
  const similarTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(lowerInput) ||
    task.category?.toLowerCase().includes(lowerInput)
  );
  
  if (similarTasks.length > 0) {
    similarTasks.slice(0, 2).forEach(task => {
      suggestions.push({
        type: 'task',
        suggestion: `Continue with "${task.title}"`,
        confidence: 0.8,
        reasoning: 'Similar to existing task'
      });
    });
  }

  // Smart time suggestions based on patterns
  const now = new Date();
  const hour = now.getHours();
  
  if (lowerInput.includes('meeting') || lowerInput.includes('call')) {
    const suggestedTime = hour < 12 ? '10:00 AM' : '2:00 PM';
    suggestions.push({
      type: 'time',
      suggestion: `Schedule for ${suggestedTime}`,
      confidence: 0.75,
      reasoning: 'Optimal meeting time'
    });
  }

  if (lowerInput.includes('exercise') || lowerInput.includes('workout')) {
    const suggestedTime = hour < 8 ? '7:00 AM' : '6:00 PM';
    suggestions.push({
      type: 'time',
      suggestion: `Schedule for ${suggestedTime}`,
      confidence: 0.8,
      reasoning: 'Common exercise time'
    });
  }

  // Priority suggestions based on keywords
  if (lowerInput.includes('urgent') || lowerInput.includes('important') || lowerInput.includes('asap')) {
    suggestions.push({
      type: 'priority',
      suggestion: 'Set as High priority',
      confidence: 0.9,
      reasoning: 'Urgency keywords detected'
    });
  }

  if (lowerInput.includes('later') || lowerInput.includes('sometime') || lowerInput.includes('eventually')) {
    suggestions.push({
      type: 'priority',
      suggestion: 'Set as Low priority',
      confidence: 0.8,
      reasoning: 'Low urgency keywords detected'
    });
  }

  // Category suggestions
  if (lowerInput.includes('doctor') || lowerInput.includes('dentist') || lowerInput.includes('health')) {
    suggestions.push({
      type: 'category',
      suggestion: 'Categorize as Health',
      confidence: 0.9,
      reasoning: 'Health-related keywords detected'
    });
  }

  if (lowerInput.includes('shop') || lowerInput.includes('buy') || lowerInput.includes('grocery')) {
    suggestions.push({
      type: 'category',
      suggestion: 'Categorize as Shopping',
      confidence: 0.85,
      reasoning: 'Shopping keywords detected'
    });
  }

  if (lowerInput.includes('learn') || lowerInput.includes('course') || lowerInput.includes('study')) {
    suggestions.push({
      type: 'category',
      suggestion: 'Categorize as Learning',
      confidence: 0.85,
      reasoning: 'Learning keywords detected'
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

export function analyzeProductivityPatterns(tasks: Task[]): {
  insights: string[];
  recommendations: string[];
} {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analyze task completion patterns
  const totalTasks = tasks.length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High').length;
  const scheduledTasks = tasks.filter(t => t.start).length;

  if (highPriorityTasks / totalTasks > 0.6) {
    insights.push(`${Math.round((highPriorityTasks / totalTasks) * 100)}% of your tasks are high priority`);
    recommendations.push('Consider reassessing task priorities to focus on what truly matters');
  }

  if (scheduledTasks / totalTasks < 0.4) {
    insights.push(`Only ${Math.round((scheduledTasks / totalTasks) * 100)}% of your tasks are scheduled`);
    recommendations.push('Try scheduling more tasks to improve time management');
  }

  // Analyze task timing patterns
  const tasksByHour: Record<number, number> = {};
  tasks.forEach(task => {
    if (task.start) {
      const hour = new Date(task.start).getHours();
      tasksByHour[hour] = (tasksByHour[hour] || 0) + 1;
    }
  });

  const peakHour = Object.entries(tasksByHour)
    .sort(([,a], [,b]) => b - a)[0];

  if (peakHour) {
    const hour = parseInt(peakHour[0]);
    const timeLabel = hour < 12 ? `${hour}:00 AM` : `${hour - 12 || 12}:00 PM`;
    insights.push(`Your most scheduled time is around ${timeLabel}`);
    
    if (hour < 9) {
      recommendations.push('Great job being an early bird! Morning productivity is excellent');
    } else if (hour > 18) {
      recommendations.push('Consider moving some tasks earlier in the day for better work-life balance');
    }
  }

  // Category analysis
  const categoryCount: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.category) {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    }
  });

  const topCategory = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0];

  if (topCategory && topCategory[1] > totalTasks * 0.4) {
    insights.push(`${topCategory[0]} makes up ${Math.round((topCategory[1] / totalTasks) * 100)}% of your tasks`);
    recommendations.push('Consider diversifying your task categories for better life balance');
  }

  return { insights, recommendations };
}

/**
 * Basic NLP parser for voice input
 * Attempts to extract task details from natural language
 * Format examples: "tomorrow 3pm low 45m", "meeting high", "call john medium tomorrow 2:30pm"
 */
export function parseVoiceInput(text: string): ParsedVoiceInput {
  const result: ParsedVoiceInput = {
    title: text.trim() // fallback to full text as title
  };
  
  let cleanedText = text.toLowerCase().trim();
  
  // Extract priority (low, medium, high)
  const priorityMatch = cleanedText.match(/\b(low|medium|high)\b/);
  if (priorityMatch) {
    result.priority = (priorityMatch[1].charAt(0).toUpperCase() + priorityMatch[1].slice(1)) as Priority;
    cleanedText = cleanedText.replace(/\b(low|medium|high)\b/, '').trim();
  }
  
  // Extract duration (e.g., "45m", "2h", "90 minutes")
  const durationMatch = cleanedText.match(/\b(\d+)\s*(m|min|minutes?|h|hr|hours?)\b/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    
    if (unit.startsWith('h')) {
      result.durationMin = value * 60;
    } else {
      result.durationMin = value;
    }
    
    cleanedText = cleanedText.replace(/\b\d+\s*(m|min|minutes?|h|hr|hours?)\b/, '').trim();
  }
  
  // Extract time and date
  const timeInfo = extractTimeInfo(cleanedText);
  if (timeInfo.datetime) {
    result.start = timeInfo.datetime;
    cleanedText = timeInfo.remainingText;
  }
  
  // Clean up the remaining text as the title
  result.title = cleanedText
    .replace(/\s+/g, ' ')
    .trim() || text.trim(); // fallback to original if cleaning removed everything
  
  return result;
}

/**
 * Parse voice commands for task management
 * Handles editing, deleting, and other task operations
 */
export function parseVoiceCommand(text: string): VoiceCommand | null {
  const lowerText = text.toLowerCase().trim();
  
  // Edit task patterns
  const editPatterns = [
    /^edit (?:task )?(.+?) (?:to be |as |to )?(.+)$/,
    /^change (?:task )?(.+?) (?:to be |as |to )?(.+)$/,
    /^update (?:task )?(.+?) (?:to be |as |to )?(.+)$/,
    /^modify (?:task )?(.+?) (?:to be |as |to )?(.+)$/
  ];
  
  for (const pattern of editPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const taskIdentifier = match[1];
      const newContent = match[2];
      const updates = parseVoiceInput(newContent);
      
      return {
        type: 'edit',
        taskIdentifier,
        updates
      };
    }
  }
  
  // Delete task patterns
  const deletePatterns = [
    /^delete (?:task )?(.+)$/,
    /^remove (?:task )?(.+)$/,
    /^cancel (?:task )?(.+)$/
  ];
  
  for (const pattern of deletePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return {
        type: 'delete',
        taskIdentifier: match[1]
      };
    }
  }
  
  // Complete task patterns
  const completePatterns = [
    /^complete (?:task )?(.+)$/,
    /^finish (?:task )?(.+)$/,
    /^done (?:with )?(?:task )?(.+)$/,
    /^mark (?:task )?(.+?) (?:as )?(?:complete|done|finished)$/
  ];
  
  for (const pattern of completePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return {
        type: 'complete',
        taskIdentifier: match[1]
      };
    }
  }
  
  // Move task patterns
  const movePatterns = [
    /^move (?:task )?(.+?) to (.+)$/,
    /^reschedule (?:task )?(.+?) (?:to |for )?(.+)$/,
    /^shift (?:task )?(.+?) to (.+)$/
  ];
  
  for (const pattern of movePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const taskIdentifier = match[1];
      const dateInfo = parseDateExpressions(match[2]);
      
      return {
        type: 'move',
        taskIdentifier,
        newDate: dateInfo.date ? format(dateInfo.date, "yyyy-MM-dd'T'HH:mm") : undefined
      };
    }
  }
  
  // Search/Show tasks patterns
  const searchPatterns = [
    /^(?:show|list|find) (?:tasks? )?(?:for |on )?(.+)$/,
    /^what (?:tasks? )?(?:do i have |are scheduled )(?:for |on )?(.+)$/,
    /^(?:tasks? |what's )(?:for |on )?(.+)$/
  ];
  
  for (const pattern of searchPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const dateInfo = parseDateExpressions(match[1]);
      
      return {
        type: 'search',
        newDate: dateInfo.date ? format(dateInfo.date, "yyyy-MM-dd'T'HH:mm") : match[1]
      };
    }
  }
  
  // If no command pattern matches, treat as create task
  return {
    type: 'create',
    updates: parseVoiceInput(text)
  };
}

/**
 * Find tasks by partial title match (fuzzy search)
 */
export function findTasksByTitle(tasks: any[], searchTitle: string): any[] {
  const normalizedSearch = searchTitle.toLowerCase().trim();
  
  return tasks.filter(task => {
    const normalizedTitle = task.title.toLowerCase();
    
    // Exact match
    if (normalizedTitle === normalizedSearch) return true;
    
    // Contains match
    if (normalizedTitle.includes(normalizedSearch)) return true;
    
    // Word match (any word in search appears in title)
    const searchWords = normalizedSearch.split(/\s+/);
    const titleWords = normalizedTitle.split(/\s+/);
    
    return searchWords.some(searchWord => 
      titleWords.some(titleWord => 
        titleWord.includes(searchWord) || searchWord.includes(titleWord)
      )
    );
  }).sort((a, b) => {
    // Sort by relevance - exact matches first, then contains, then word matches
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    
    if (aTitle === normalizedSearch) return -1;
    if (bTitle === normalizedSearch) return 1;
    
    if (aTitle.includes(normalizedSearch) && !bTitle.includes(normalizedSearch)) return -1;
    if (bTitle.includes(normalizedSearch) && !aTitle.includes(normalizedSearch)) return 1;
    
    return 0;
  });
}

/**
 * Parse various date expressions from natural language
 */
function parseDateExpressions(text: string): { date?: Date; remainingText: string } {
  let remainingText = text.toLowerCase();
  const today = new Date();
  
  // Weekday names mapping
  const weekdays: { [key: string]: number } = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6
  };

  // Month names mapping
  const months: { [key: string]: number } = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };

  // 1. Handle basic relative dates
  if (remainingText.includes('tomorrow')) {
    remainingText = remainingText.replace(/\btomorrow\b/g, '').trim();
    return { date: addDays(startOfDay(today), 1), remainingText };
  }
  
  if (remainingText.includes('today')) {
    remainingText = remainingText.replace(/\btoday\b/g, '').trim();
    return { date: startOfDay(today), remainingText };
  }

  if (remainingText.includes('day after tomorrow')) {
    remainingText = remainingText.replace(/\bday after tomorrow\b/g, '').trim();
    return { date: addDays(startOfDay(today), 2), remainingText };
  }

  // 2. Handle "in X days" patterns
  const inDaysMatch = remainingText.match(/\bin (\d+) days?\b/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    remainingText = remainingText.replace(inDaysMatch[0], '').trim();
    return { date: addDays(startOfDay(today), days), remainingText };
  }

  // 3. Handle "next week" / "in a week"
  if (remainingText.includes('next week') || remainingText.includes('in a week')) {
    remainingText = remainingText.replace(/\b(next week|in a week)\b/g, '').trim();
    return { date: addWeeks(startOfDay(today), 1), remainingText };
  }

  // 4. Handle weekday patterns: "monday", "next monday", "this friday"
  const weekdayPatterns = [
    /\bnext (sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/,
    /\bthis (sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/,
    /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/
  ];

  for (const pattern of weekdayPatterns) {
    const match = remainingText.match(pattern);
    if (match) {
      const weekdayName = match[1] || match[0];
      const targetWeekday = weekdays[weekdayName];
      const isNext = match[0].includes('next');
      const isThis = match[0].includes('this');
      
      if (targetWeekday !== undefined) {
        let targetDate: Date;
        const currentWeekday = getDay(today);
        
        if (isNext) {
          // Always next occurrence (next week)
          targetDate = nextDay(today, targetWeekday);
          if (getDay(targetDate) === currentWeekday) {
            targetDate = addWeeks(targetDate, 1);
          }
        } else if (isThis) {
          // This week's occurrence
          if (targetWeekday > currentWeekday) {
            targetDate = nextDay(today, targetWeekday);
          } else if (targetWeekday === currentWeekday) {
            targetDate = today; // Today if it's the same weekday
          } else {
            targetDate = nextDay(today, targetWeekday); // Next week if already passed
          }
        } else {
          // Just "monday" - next occurrence
          if (targetWeekday > currentWeekday) {
            targetDate = nextDay(today, targetWeekday);
          } else if (targetWeekday === currentWeekday) {
            targetDate = today; // Today if it's the same weekday
          } else {
            targetDate = nextDay(today, targetWeekday); // Next week
          }
        }
        
        remainingText = remainingText.replace(match[0], '').trim();
        return { date: startOfDay(targetDate), remainingText };
      }
    }
  }

  // 5. Handle month + day patterns: "december 15", "dec 15th", "december 15th"
  const monthDayPattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(st|nd|rd|th)?\b/;
  const monthDayMatch = remainingText.match(monthDayPattern);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2]);
    const month = months[monthName];
    
    if (month !== undefined && day >= 1 && day <= 31) {
      let targetDate = new Date(today.getFullYear(), month, day);
      
      // If the date has already passed this year, use next year
      if (targetDate < today) {
        targetDate = new Date(today.getFullYear() + 1, month, day);
      }
      
      remainingText = remainingText.replace(monthDayMatch[0], '').trim();
      return { date: startOfDay(targetDate), remainingText };
    }
  }

  // 6. Handle numeric date patterns: "12/15", "15/12", "12-15"
  const numericDatePattern = /\b(\d{1,2})[\/\-](\d{1,2})\b/;
  const numericMatch = remainingText.match(numericDatePattern);
  if (numericMatch) {
    const first = parseInt(numericMatch[1]);
    const second = parseInt(numericMatch[2]);
    
    // Assume MM/DD format for US users (month/day)
    if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
      let targetDate = new Date(today.getFullYear(), first - 1, second);
      
      // If the date has already passed this year, use next year
      if (targetDate < today) {
        targetDate = new Date(today.getFullYear() + 1, first - 1, second);
      }
      
      remainingText = remainingText.replace(numericMatch[0], '').trim();
      return { date: startOfDay(targetDate), remainingText };
    }
  }

  // No date found
  return { remainingText: text };
}

/**
 * Extract time and date information from text
 */
function extractTimeInfo(text: string): { datetime?: string; remainingText: string } {
  let remainingText = text;
  let targetDate = new Date();
  let timeSet = false;
  let dateSet = false;
  
  // Parse date expressions first
  const dateInfo = parseDateExpressions(remainingText);
  if (dateInfo.date) {
    targetDate = dateInfo.date;
    remainingText = dateInfo.remainingText;
    dateSet = true;
  }
  
  // Extract time patterns
  // Pattern 1: "3pm", "2:30pm", "14:30"
  const timePattern1 = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const timeMatch1 = remainingText.match(timePattern1);
  
  if (timeMatch1) {
    let hours = parseInt(timeMatch1[1]);
    const minutes = timeMatch1[2] ? parseInt(timeMatch1[2]) : 0;
    const period = timeMatch1[3]?.toLowerCase();
    
    // Handle 12-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    // Set time if valid
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      targetDate = setMinutes(setHours(targetDate, hours), minutes);
      timeSet = true;
      remainingText = remainingText.replace(timePattern1, '').trim();
    }
  }
  
  // Pattern 2: "at 15:30", "at 3:30"
  const timePattern2 = /\bat\s+(\d{1,2}):(\d{2})\b/i;
  const timeMatch2 = remainingText.match(timePattern2);
  
  if (timeMatch2 && !timeSet) {
    const hours = parseInt(timeMatch2[1]);
    const minutes = parseInt(timeMatch2[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      targetDate = setMinutes(setHours(targetDate, hours), minutes);
      timeSet = true;
      remainingText = remainingText.replace(timePattern2, '').trim();
    }
  }
  
  return {
    datetime: (timeSet || dateSet) ? format(targetDate, "yyyy-MM-dd'T'HH:mm") : undefined,
    remainingText: remainingText.replace(/\s+/g, ' ').trim()
  };
}

/**
 * Check if the browser supports Web Speech API
 */
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Create a speech recognition instance
 */
export function createSpeechRecognition(): any | null {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  return recognition;
}