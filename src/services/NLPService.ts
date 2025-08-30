import { ParsedVoiceInput, AISuggestions, Location } from '../types';
import { supabase } from '../lib/supabase';
import * as chrono from 'chrono-node';

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

  // Main parsing function that calls the edge function with timeout
  static async parseVoiceInput(request: NLPParseRequest): Promise<ParsedVoiceInput> {
    const startTime = performance.now();
    console.log('🚀 Starting voice input parsing...');

    try {
      // Create a promise that rejects after 3 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Edge function timeout - falling back to client-side parsing')), 3000);
      });

      // Race the edge function call against the timeout
      const edgeFunctionPromise = supabase.functions.invoke('parse-task', {
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

      const { data, error } = await Promise.race([edgeFunctionPromise, timeoutPromise]);

      if (error) {
        const edgeTime = performance.now() - startTime;
        console.error(`❌ NLP parsing error after ${edgeTime.toFixed(0)}ms:`, error);
        // Fall back to client-side parsing
        console.log('🔄 Falling back to enhanced client-side parsing...');
        return this.fallbackParse(request.text, request.userTimezone);
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

      const edgeTime = performance.now() - startTime;
      console.log(`✅ Edge function completed in ${edgeTime.toFixed(0)}ms. Result:`, result);
      return result;

    } catch (error) {
      const fallbackTime = performance.now() - startTime;
      console.error(`❌ Edge function failed after ${fallbackTime.toFixed(0)}ms:`, error);
      // Fall back to client-side parsing
      console.log('🔄 Using enhanced fallback parsing...');
      const fallbackStartTime = performance.now();
      const result = this.fallbackParse(request.text, request.userTimezone);
      const totalFallbackTime = performance.now() - fallbackStartTime;
      console.log(`✅ Fallback parsing completed in ${totalFallbackTime.toFixed(0)}ms`);
      return result;
    }
  }

  // Enhanced fallback client-side parsing using chrono-node
  private static fallbackParse(text: string, userTimezone?: string): ParsedVoiceInput {
    console.log('🔄 Using enhanced fallback parsing for:', text);
    
    const result: ParsedVoiceInput = {
      title: text.trim(),
      type: 'task',
      priority: 3,
      tags: [],
      confidence: this.FALLBACK_CONFIDENCE,
      raw_text: text
    };

    // Parse dates and times using chrono-node with proper timezone
    const chronoOptions = {
      timezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      forwardDate: true
    };

    try {
      const dateResults = chrono.parse(text, new Date(), chronoOptions);
      console.log('📅 Chrono fallback parse results:', dateResults);

      if (dateResults.length > 0) {
        const dateResult = dateResults[0];
        console.log('📅 Found date/time:', dateResult.text, 'parsed as:', dateResult.start.date());
        
        // Determine if this is an event (has specific time) or task
        const hasTime = dateResult.start.get('hour') !== null && dateResult.start.get('hour') !== undefined;
        result.type = hasTime ? 'event' : 'task';
        
        if (result.type === 'event') {
          result.start_at = dateResult.start.date().toISOString();
          
          // If end time is specified, use it
          if (dateResult.end) {
            result.end_at = dateResult.end.date().toISOString();
          } else {
            // Default duration based on context
            let duration = 60; // Default 1 hour
            if (text.toLowerCase().includes('dentist') || text.toLowerCase().includes('doctor')) {
              duration = 30; // Medical appointments are usually shorter
            } else if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('call')) {
              duration = 60; // Meetings default to 1 hour
            }
            
            // Check for explicit duration
            const durationMatch = text.match(/(\d+)\s*(hour|hr|h|minute|min|m)s?/i);
            if (durationMatch) {
              const value = parseInt(durationMatch[1]);
              const unit = durationMatch[2].toLowerCase();
              duration = unit.startsWith('h') ? value * 60 : value;
            }
            
            const endDate = new Date(result.start_at);
            endDate.setMinutes(endDate.getMinutes() + duration);
            result.end_at = endDate.toISOString();
          }
          
          result.all_day = !hasTime;
        } else {
          // For tasks, set due_at
          result.due_at = dateResult.start.date().toISOString();
        }
        
        result.confidence = (result.confidence || this.FALLBACK_CONFIDENCE) + 0.2; // Boost confidence for successful date parsing
        
        // Clean up the title by removing the parsed date/time text
        let cleanTitle = text.replace(dateResult.text, '').trim();
        // Remove extra spaces and connectors
        cleanTitle = cleanTitle
          .replace(/\s+/g, ' ')
          .replace(/^\s*(at|for|about)\s+/i, '')
          .replace(/\s+(at|for|about)\s*$/i, '')
          .trim();
        
        if (cleanTitle) {
          result.title = cleanTitle;
        }
      } else {
        console.log('⚠️ No dates found in fallback parsing');
      }
    } catch (error) {
      console.error('❌ Chrono fallback parsing error:', error);
    }

    // Enhanced priority detection
    const lowerText = text.toLowerCase();
    const priorityKeywords = {
      5: ['urgent', 'asap', 'emergency', 'critical', 'immediately'],
      4: ['high', 'important', 'priority', 'soon'],
      3: ['medium', 'normal'],
      2: ['low', 'later', 'when possible'],
      1: ['someday', 'maybe', 'eventually']
    };

    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        result.priority = parseInt(priority) as 1 | 2 | 3 | 4 | 5;
        console.log(`🔥 Priority detected: ${priority} (${keywords.find(k => lowerText.includes(k))})`);
        break;
      }
    }

    // Enhanced type detection
    const eventKeywords = ['meeting', 'appointment', 'event', 'call', 'interview', 'conference', 'presentation', 'lunch', 'dinner'];
    if (eventKeywords.some(keyword => lowerText.includes(keyword))) {
      result.type = 'event';
      console.log('📅 Event type detected');
    }

    // Enhanced category detection
    const categories = {
      work: ['meeting', 'call', 'project', 'deadline', 'office', 'client', 'presentation', 'review'],
      health: ['doctor', 'dentist', 'appointment', 'checkup', 'hospital', 'pharmacy', 'exercise', 'gym'],
      personal: ['birthday', 'family', 'home', 'clean', 'organize', 'personal', 'mom', 'dad', 'son', 'daughter'],
      shopping: ['buy', 'purchase', 'store', 'market', 'grocery', 'shopping'],
      finance: ['bank', 'payment', 'bill', 'tax', 'budget', 'insurance'],
      travel: ['flight', 'hotel', 'trip', 'vacation', 'travel', 'airport'],
      learning: ['study', 'course', 'class', 'training', 'learn', 'education'],
      social: ['party', 'dinner', 'lunch', 'friend', 'event', 'celebrate']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        result.category = category;
        console.log(`📂 Category detected: ${category}`);
        break;
      }
    }

    // Enhanced location detection with multiple patterns
    const locationPatterns = [
      /\bat\s+([^,\n]+?)(?:\s|$|,)/i,
      /\bin\s+([^,\n]+?)(?:\s|$|,)/i,
      /\s@\s*([^,\n]+?)(?:\s|$|,)/i,
      /\bto\s+([^,\n]+?)(?:\s|$|,)/i
    ];

    for (const pattern of locationPatterns) {
      const locationMatch = text.match(pattern);
      if (locationMatch) {
        const location = locationMatch[1].trim();
        // Filter out common non-location words
        const nonLocations = ['me', 'him', 'her', 'them', 'it', 'be', 'do', 'go', 'get', 'see', 'know'];
        if (!nonLocations.includes(location.toLowerCase()) && location.length > 2) {
          result.location_name = location;
          console.log(`📍 Location detected: ${location}`);
          break;
        }
      }
    }

    console.log('✅ Fallback parsing result:', {
      title: result.title,
      type: result.type,
      start_at: result.start_at,
      end_at: result.end_at,
      due_at: result.due_at,
      priority: result.priority,
      category: result.category,
      location_name: result.location_name,
      confidence: result.confidence
    });

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