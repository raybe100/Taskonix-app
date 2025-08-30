import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import * as chrono from "https://esm.sh/chrono-node@2.7.5";

// Types
interface ParseTaskRequest {
  text: string;
  userTimezone?: string;
  defaultRadius?: number;
  userLocation?: {
    lat: number;
    lng: number;
  };
  savedLocations?: Array<{
    name: string;
    lat: number;
    lng: number;
    radius_m: number;
  }>;
}

interface ParsedResult {
  title: string;
  notes?: string;
  type: 'task' | 'event';
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
  due_at?: string;
  location_name?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  recurrence_rrule?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  category?: string;
  ai_suggestions: {
    suggested_reminders: Array<{
      trigger_type: 'datetime' | 'offset' | 'geofence';
      offset_minutes?: number;
      lead_time_minutes: number;
      message?: string;
    }>;
    confidence_score: number;
    parsing_notes: string[];
    travel_time_minutes?: number;
  };
  confidence: number;
  raw_text: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Places API key
const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, userTimezone = 'America/New_York', defaultRadius = 150, userLocation, savedLocations } = await req.json() as ParseTaskRequest;

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Parsing text:', text);
    console.log('📅 User timezone:', userTimezone);

    // Initialize parsing result
    const result: ParsedResult = {
      title: text.trim(),
      type: 'task',
      priority: 3,
      tags: [],
      ai_suggestions: {
        suggested_reminders: [],
        confidence_score: 0.7,
        parsing_notes: []
      },
      confidence: 0.7,
      raw_text: text
    };

    // Parse dates and times using chrono-node with enhanced configuration
    const parseOptions = {
      timezone: userTimezone,
      forwardDate: true
    };

    // Try multiple parsing strategies for better accuracy
    let dateResults = chrono.parse(text, new Date(), parseOptions);
    
    // If no results, try with casual parser
    if (dateResults.length === 0) {
      dateResults = chrono.casual.parse(text, new Date(), parseOptions);
    }
    
    // If still no results, try with strict parser  
    if (dateResults.length === 0) {
      dateResults = chrono.strict.parse(text, new Date(), parseOptions);
    }
    console.log('📅 Chrono parse results:', dateResults);

    if (dateResults.length > 0) {
      const dateResult = dateResults[0];
      console.log('📅 Parsed date text:', dateResult.text);
      console.log('📅 Parsed date object:', dateResult.start.date());
      console.log('📅 Has time:', dateResult.start.get('hour') !== null);
      
      result.ai_suggestions.parsing_notes.push(`Found date/time: ${dateResult.text}`);
      
      // Determine if this is an event (has specific time) or task
      const hasTime = dateResult.start.get('hour') !== null;
      result.type = hasTime ? 'event' : 'task';
      
      if (result.type === 'event') {
        result.start_at = dateResult.start.date().toISOString();
        
        // If end time is specified, use it
        if (dateResult.end) {
          result.end_at = dateResult.end.date().toISOString();
        } else {
          // Default 1 hour duration for meetings, 30 minutes for others
          const duration = text.toLowerCase().includes('meeting') ? 60 : 30;
          const endDate = new Date(result.start_at);
          endDate.setMinutes(endDate.getMinutes() + duration);
          result.end_at = endDate.toISOString();
        }
        
        result.all_day = !hasTime;
      } else {
        // For tasks, set due_at
        result.due_at = dateResult.start.date().toISOString();
      }
      
      result.ai_suggestions.confidence_score += 0.2;
    } else {
      result.ai_suggestions.parsing_notes.push('No specific date/time found');
    }

    // Extract priority keywords
    const priorityKeywords = {
      5: ['urgent', 'asap', 'emergency', 'critical', 'immediately'],
      4: ['high', 'important', 'priority', 'soon'],
      3: ['medium', 'normal'],
      2: ['low', 'later', 'when possible'],
      1: ['someday', 'maybe', 'eventually']
    };

    const lowerText = text.toLowerCase();
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        result.priority = parseInt(priority) as 1 | 2 | 3 | 4 | 5;
        result.ai_suggestions.parsing_notes.push(`Priority detected: ${keywords.find(k => lowerText.includes(k))}`);
        result.ai_suggestions.confidence_score += 0.1;
        break;
      }
    }

    // Extract duration and convert to end time for events
    const durationMatch = text.match(/(\d+)\s*(hour|hr|h|minute|min|m)s?/i);
    if (durationMatch && result.type === 'event' && result.start_at) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      const minutes = unit.startsWith('h') ? value * 60 : value;
      
      const endDate = new Date(result.start_at);
      endDate.setMinutes(endDate.getMinutes() + minutes);
      result.end_at = endDate.toISOString();
      
      result.ai_suggestions.parsing_notes.push(`Duration detected: ${value} ${unit}`);
    }

    // Detect location mentions
    const locationResult = await extractLocation(text, savedLocations, googlePlacesApiKey);
    if (locationResult) {
      result.location_name = locationResult.name;
      result.lat = locationResult.lat;
      result.lng = locationResult.lng;
      result.radius_m = locationResult.radius || defaultRadius;
      result.ai_suggestions.parsing_notes.push(`Location detected: ${locationResult.name}`);
      result.ai_suggestions.confidence_score += 0.15;
    }

    // Detect categories based on keywords
    const categories = {
      work: ['meeting', 'call', 'project', 'deadline', 'office', 'client', 'presentation', 'review'],
      health: ['doctor', 'dentist', 'appointment', 'checkup', 'hospital', 'pharmacy', 'exercise', 'gym'],
      personal: ['birthday', 'family', 'home', 'clean', 'organize', 'personal'],
      shopping: ['buy', 'purchase', 'store', 'market', 'grocery', 'shopping'],
      finance: ['bank', 'payment', 'bill', 'tax', 'budget', 'insurance'],
      travel: ['flight', 'hotel', 'trip', 'vacation', 'travel', 'airport'],
      learning: ['study', 'course', 'class', 'training', 'learn', 'education'],
      social: ['party', 'dinner', 'lunch', 'friend', 'event', 'celebrate']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        result.category = category;
        result.ai_suggestions.parsing_notes.push(`Category detected: ${category}`);
        result.ai_suggestions.confidence_score += 0.1;
        break;
      }
    }

    // Extract tags (hashtags or @mentions)
    const tagMatches = text.match(/#(\w+)|@(\w+)/g);
    if (tagMatches) {
      result.tags = tagMatches.map(tag => tag.substring(1));
      result.ai_suggestions.parsing_notes.push(`Tags found: ${result.tags.join(', ')}`);
    }

    // Clean up the title by removing parsed elements
    let cleanTitle = text;
    
    // Remove date/time phrases
    if (dateResults.length > 0) {
      cleanTitle = cleanTitle.replace(dateResults[0].text, '').trim();
    }
    
    // Remove duration mentions
    if (durationMatch) {
      cleanTitle = cleanTitle.replace(durationMatch[0], '').trim();
    }
    
    // Remove location if it was at the end
    if (locationResult && cleanTitle.toLowerCase().endsWith(locationResult.name.toLowerCase())) {
      cleanTitle = cleanTitle.slice(0, -locationResult.name.length).trim();
      cleanTitle = cleanTitle.replace(/\s+at\s*$/i, '').trim();
    }
    
    // Remove priority keywords
    Object.values(priorityKeywords).flat().forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      cleanTitle = cleanTitle.replace(regex, '').trim();
    });

    // Clean up multiple spaces and common connectors
    cleanTitle = cleanTitle
      .replace(/\s+/g, ' ')
      .replace(/^\s*(at|for|about)\s+/i, '')
      .replace(/\s+(at|for|about)\s*$/i, '')
      .trim();

    if (cleanTitle) {
      result.title = cleanTitle;
    }

    // Generate smart reminders based on type and content
    result.ai_suggestions.suggested_reminders = generateSmartReminders(result, userLocation);

    // Calculate travel time if location is provided and user location is available
    if (result.lat && result.lng && userLocation && googlePlacesApiKey) {
      try {
        const travelTime = await calculateTravelTime(
          userLocation.lat, 
          userLocation.lng,
          result.lat,
          result.lng,
          googlePlacesApiKey
        );
        
        if (travelTime) {
          result.ai_suggestions.travel_time_minutes = travelTime;
          result.ai_suggestions.parsing_notes.push(`Estimated travel time: ${travelTime} minutes`);
          
          // Add travel reminder
          result.ai_suggestions.suggested_reminders.push({
            trigger_type: 'offset',
            offset_minutes: travelTime + 10, // 10 minutes buffer
            lead_time_minutes: travelTime + 10,
            message: `Time to leave for ${result.location_name}`
          });
        }
      } catch (error) {
        console.error('Error calculating travel time:', error);
      }
    }

    console.log('Final parsed result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing task:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to parse task' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract location information
async function extractLocation(
  text: string, 
  savedLocations?: Array<{ name: string; lat: number; lng: number; radius_m: number }>,
  googleApiKey?: string
): Promise<{ name: string; lat: number; lng: number; radius?: number } | null> {
  const lowerText = text.toLowerCase();
  
  // Check saved locations first
  if (savedLocations) {
    for (const location of savedLocations) {
      if (lowerText.includes(location.name.toLowerCase())) {
        return {
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          radius: location.radius_m
        };
      }
    }
  }
  
  // Look for common location patterns
  const locationPatterns = [
    /\bat\s+([^,]+?)(?:\s|$|,)/i,
    /\bin\s+([^,]+?)(?:\s|$|,)/i,
    /\s@\s*([^,]+?)(?:\s|$|,)/i
  ];
  
  let locationName = null;
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      locationName = match[1].trim();
      break;
    }
  }
  
  if (!locationName || !googleApiKey) {
    return null;
  }
  
  try {
    // Use Google Places API to resolve location
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(locationName)}&inputtype=textquery&fields=name,geometry,formatted_address&key=${googleApiKey}`
    );
    
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const place = data.candidates[0];
      return {
        name: place.name || locationName,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      };
    }
  } catch (error) {
    console.error('Error resolving location:', error);
  }
  
  return null;
}

// Helper function to calculate travel time
async function calculateTravelTime(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  googleApiKey: string
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&units=metric&key=${googleApiKey}`
    );
    
    const data = await response.json();
    
    if (data.rows && data.rows[0]?.elements && data.rows[0].elements[0]?.duration) {
      return Math.ceil(data.rows[0].elements[0].duration.value / 60); // Convert seconds to minutes
    }
  } catch (error) {
    console.error('Error calculating travel time:', error);
  }
  
  return null;
}

// Helper function to generate smart reminders
function generateSmartReminders(
  result: ParsedResult,
  userLocation?: { lat: number; lng: number }
): Array<{
  trigger_type: 'datetime' | 'offset' | 'geofence';
  offset_minutes?: number;
  lead_time_minutes: number;
  message?: string;
}> {
  const reminders = [];
  
  if (result.type === 'event' && result.start_at) {
    // For events with locations, add location-based reminder
    if (result.lat && result.lng) {
      reminders.push({
        trigger_type: 'geofence' as const,
        lead_time_minutes: 0,
        message: `You've arrived at ${result.location_name}`
      });
      
      // Add travel time reminder
      reminders.push({
        trigger_type: 'offset' as const,
        offset_minutes: 30, // 30 minutes before
        lead_time_minutes: 30,
        message: `${result.title} starts in 30 minutes`
      });
    } else {
      // Standard event reminder
      const reminderTime = result.category === 'work' ? 15 : 10;
      reminders.push({
        trigger_type: 'offset' as const,
        offset_minutes: reminderTime,
        lead_time_minutes: reminderTime,
        message: `${result.title} starts in ${reminderTime} minutes`
      });
    }
  } else if (result.type === 'task' && result.due_at) {
    // Task due reminders
    if (result.priority >= 4) {
      // High priority - remind earlier
      reminders.push({
        trigger_type: 'offset' as const,
        offset_minutes: 60, // 1 hour before
        lead_time_minutes: 60,
        message: `High priority task "${result.title}" is due soon`
      });
    } else {
      // Normal reminder
      reminders.push({
        trigger_type: 'offset' as const,
        offset_minutes: 15,
        lead_time_minutes: 15,
        message: `Task "${result.title}" is due soon`
      });
    }
  }
  
  return reminders;
}