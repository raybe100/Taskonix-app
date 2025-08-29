import { ParsedVoiceInput, AISuggestions, Location } from '../types';
import { supabase } from '../lib/supabase';

export interface NLPParseRequest {
  text: string;
  userTimezone?: string;
  defaultRadius?: number;
  userLocation?: {
    lat: number;
    lng: number;
  };
  savedLocations?: Location[];
}

export interface NLPParseResponse extends ParsedVoiceInput {
  ai_suggestions: AISuggestions;
}

export class NLPService {
  private static readonly FALLBACK_CONFIDENCE = 0.6;

  // Main parsing function that calls the edge function
  static async parseVoiceInput(request: NLPParseRequest): Promise<ParsedVoiceInput> {
    try {
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('parse-task', {
        body: {
          text: request.text,
          userTimezone: request.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          defaultRadius: request.defaultRadius || 150,
          userLocation: request.userLocation,
          savedLocations: request.savedLocations?.map(loc => ({
            name: loc.name,
            lat: loc.lat,
            lng: loc.lng,
            radius_m: loc.radius_m
          }))
        }
      });

      if (error) {
        console.error('NLP parsing error:', error);
        // Fall back to client-side parsing
        return this.fallbackParse(request.text);
      }

      // Transform the response to match our interface
      const result: ParsedVoiceInput = {
        title: data.title,
        notes: data.notes,
        type: data.type,
        start_at: data.start_at,
        end_at: data.end_at,
        all_day: data.all_day,
        due_at: data.due_at,
        location_name: data.location_name,
        priority: data.priority,
        tags: data.tags,
        category: data.category,
        confidence: data.confidence,
        raw_text: data.raw_text
      };

      // Add location coordinates if available
      if (data.lat && data.lng) {
        result.lat = data.lat;
        result.lng = data.lng;
        result.radius_m = data.radius_m;
      }

      console.log('NLP parsed result:', result);
      return result;

    } catch (error) {
      console.error('Failed to call NLP service:', error);
      // Fall back to client-side parsing
      return this.fallbackParse(request.text);
    }
  }

  // Fallback client-side parsing when edge function is unavailable
  private static fallbackParse(text: string): ParsedVoiceInput {
    console.log('Using fallback parsing for:', text);
    
    const result: ParsedVoiceInput = {
      title: text.trim(),
      type: 'task',
      priority: 3,
      tags: [],
      confidence: this.FALLBACK_CONFIDENCE,
      raw_text: text
    };

    // Basic priority detection
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('emergency')) {
      result.priority = 5;
    } else if (lowerText.includes('high') || lowerText.includes('important')) {
      result.priority = 4;
    } else if (lowerText.includes('low') || lowerText.includes('later')) {
      result.priority = 2;
    }

    // Basic type detection
    if (lowerText.includes('meeting') || lowerText.includes('appointment') || 
        lowerText.includes('event') || lowerText.includes('call')) {
      result.type = 'event';
    }

    // Basic time detection
    const timePatterns = [
      /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
      /\b\d{1,2}\s*(am|pm)\b/i,
      /\bat\s+\d/i
    ];

    const hasTime = timePatterns.some(pattern => pattern.test(text));
    if (hasTime && result.type === 'event') {
      // Set a default start time for today + 1 hour
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      result.start_at = now.toISOString();
      
      // Default 1 hour duration
      const endTime = new Date(now);
      endTime.setHours(endTime.getHours() + 1);
      result.end_at = endTime.toISOString();
    }

    // Basic category detection
    const categories = {
      work: ['meeting', 'call', 'project', 'deadline', 'office'],
      health: ['doctor', 'dentist', 'appointment', 'checkup'],
      personal: ['birthday', 'family', 'home', 'clean'],
      shopping: ['buy', 'purchase', 'store', 'grocery']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        result.category = category;
        break;
      }
    }

    // Basic location detection
    const locationMatch = text.match(/\bat\s+([^,\n]+)/i);
    if (locationMatch) {
      result.location_name = locationMatch[1].trim();
    }

    return result;
  }

  // Utility function to test the NLP service
  static async testConnection(): Promise<{ working: boolean; error?: string }> {
    try {
      const testResult = await this.parseVoiceInput({
        text: 'Test meeting tomorrow at 2pm'
      });
      
      return {
        working: (testResult.confidence ?? 0) > this.FALLBACK_CONFIDENCE
      };
    } catch (error) {
      return {
        working: false,
        error: error instanceof Error ? error.message : 'NLP service test failed'
      };
    }
  }

  // Get parsing confidence explanation
  static getConfidenceExplanation(confidence: number): string {
    if (confidence >= 0.9) return 'Very confident - all key information detected';
    if (confidence >= 0.8) return 'Confident - most information detected accurately';
    if (confidence >= 0.7) return 'Good - key information detected with minor uncertainty';
    if (confidence >= 0.6) return 'Fair - basic information detected, please review';
    return 'Low confidence - please verify and edit the details';
  }

  // Extract recurring patterns (basic implementation)
  static detectRecurrence(text: string): string | undefined {
    const recurrencePatterns = [
      { pattern: /\bevery\s+day\b/i, rrule: 'FREQ=DAILY' },
      { pattern: /\bdaily\b/i, rrule: 'FREQ=DAILY' },
      { pattern: /\bevery\s+week\b/i, rrule: 'FREQ=WEEKLY' },
      { pattern: /\bweekly\b/i, rrule: 'FREQ=WEEKLY' },
      { pattern: /\bevery\s+month\b/i, rrule: 'FREQ=MONTHLY' },
      { pattern: /\bmonthly\b/i, rrule: 'FREQ=MONTHLY' },
      { pattern: /\bevery\s+year\b/i, rrule: 'FREQ=YEARLY' },
      { pattern: /\byearly\b/i, rrule: 'FREQ=YEARLY' },
      { pattern: /\bevery\s+monday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=MO' },
      { pattern: /\bevery\s+tuesday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TU' },
      { pattern: /\bevery\s+wednesday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=WE' },
      { pattern: /\bevery\s+thursday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TH' },
      { pattern: /\bevery\s+friday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=FR' }
    ];

    for (const { pattern, rrule } of recurrencePatterns) {
      if (pattern.test(text)) {
        return rrule;
      }
    }

    return undefined;
  }

  // Parse duration from text
  static parseDuration(text: string): number | undefined {
    const durationPatterns = [
      { pattern: /(\d+)\s*(?:hour|hr|h)s?/i, multiplier: 60 },
      { pattern: /(\d+)\s*(?:minute|min|m)s?/i, multiplier: 1 },
      { pattern: /(\d+\.5|\d+\s*and\s*a\s*half)\s*(?:hour|hr|h)s?/i, multiplier: 90 }
    ];

    for (const { pattern, multiplier } of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].includes('and') ? 1 : parseFloat(match[1]);
        return Math.round(value * multiplier);
      }
    }

    return undefined;
  }

  // Suggest default reminders based on item type and content
  static suggestDefaultReminders(item: ParsedVoiceInput): Array<{
    offset_minutes: number;
    message: string;
    trigger_type: 'offset' | 'geofence';
  }> {
    const reminders = [];

    if (item.type === 'event' && item.start_at) {
      // Event reminders
      if (item.location_name) {
        reminders.push({
          offset_minutes: 30,
          message: `Leave for ${item.location_name} in 30 minutes`,
          trigger_type: 'offset' as const
        });
      } else {
        reminders.push({
          offset_minutes: 15,
          message: `${item.title} starts in 15 minutes`,
          trigger_type: 'offset' as const
        });
      }
    } else if (item.type === 'task') {
      // Task reminders
      const reminderTime = item.priority && item.priority >= 4 ? 60 : 30;
      reminders.push({
        offset_minutes: reminderTime,
        message: `Task "${item.title}" is due soon`,
        trigger_type: 'offset' as const
      });
    }

    return reminders;
  }
}