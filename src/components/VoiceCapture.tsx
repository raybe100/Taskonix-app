import { useState, useRef, useEffect, useCallback } from 'react';
import { ParsedVoiceInput } from '../types';

interface VoiceCaptureProps {
  onVoiceResult: (result: ParsedVoiceInput) => void;
  onError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
}

export function VoiceCapture({ 
  onVoiceResult, 
  onError, 
  className = '', 
  disabled = false 
}: VoiceCaptureProps) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for Web Speech API support
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          setState(prev => ({ 
            ...prev, 
            transcript: prev.transcript + transcript,
            confidence: Math.max(prev.confidence, confidence || 0.8)
          }));
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setState(prev => ({ ...prev, interimTranscript }));
      }

      // Reset timeout on new speech
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (state.isRecording) {
          stopRecording();
        }
      }, 3000); // Auto-stop after 3 seconds of silence
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition failed';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone access denied or not available.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          // Normal when user stops recording
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      if (event.error !== 'aborted') {
        onError(errorMessage);
      }
      
      setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
    };

    // Handle end of recognition
    recognition.onend = () => {
      if (state.isRecording) {
        // If we were recording and recognition ended unexpectedly, restart
        recognition.start();
      } else {
        setState(prev => ({ ...prev, isRecording: false }));
      }
    };

    return recognition;
  }, [isSupported, onError, state.isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      onError('Speech recognition is not supported in your browser');
      return;
    }

    if (disabled) return;

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recognition = initializeRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      startTimeRef.current = Date.now();

      setState({
        isRecording: true,
        isProcessing: false,
        transcript: '',
        interimTranscript: '',
        confidence: 0
      });

      recognition.start();
    } catch (error) {
      onError('Microphone access denied. Please enable microphone permissions.');
    }
  }, [isSupported, disabled, onError, initializeRecognition]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const finalTranscript = state.transcript.trim();
    
    if (!finalTranscript) {
      setState(prev => ({ ...prev, isRecording: false }));
      return;
    }

    setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

    // Process the voice input using NLP service
    try {
      // Import NLP service dynamically to avoid circular dependencies
      const { NLPService } = await import('../services/NLPService');
      
      // Get user's current location for better parsing (optional)
      let userLocation;
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        }
      } catch (error) {
        console.log('Location access not available, continuing without location context');
      }

      const parsed = await NLPService.parseVoiceInput({
        text: finalTranscript,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userLocation,
        defaultRadius: 150
      });

      onVoiceResult(parsed);
    } catch (error) {
      console.error('Error processing voice input:', error);
      onError('Failed to process voice input');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.transcript, state.confidence, onVoiceResult, onError]);

  // Handle mouse/touch events for hold-to-record
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startRecording();
  }, [startRecording]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopRecording();
  }, [stopRecording]);

  // Fallback mouse handlers for better compatibility
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startRecording();
  }, [startRecording]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopRecording();
  }, [stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate recording duration
  const recordingDuration = state.isRecording ? 
    Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;

  // Visual feedback classes
  const buttonClasses = `
    relative flex items-center justify-center
    w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28
    rounded-full
    transition-all duration-200 ease-out
    touch-manipulation select-none
    min-w-[80px] min-h-[80px]
    border-0 outline-none focus:outline-none
    ${disabled ? 
      'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 
      state.isRecording ? 
        'bg-red-500 dark:bg-red-600 shadow-lg shadow-red-500/30 scale-110' :
        state.isProcessing ?
          'bg-blue-500 dark:bg-blue-600 shadow-lg shadow-blue-500/30' :
          'bg-primary-40 dark:bg-accent-dark-gold hover:bg-primary-40/90 dark:hover:bg-accent-dark-gold/90 hover:scale-105 shadow-elevation-3 active:scale-95'
    }
    ${state.isRecording ? 'animate-pulse' : ''}
  `;

  const pulseClasses = state.isRecording ? `
    absolute inset-0 rounded-full
    animate-ping bg-red-500 dark:bg-red-600
    opacity-20 pointer-events-none
  ` : '';

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Main Voice Capture Button */}
      <div className="relative">
        {/* Pulse animation ring */}
        {state.isRecording && <div className={pulseClasses} />}
        
        {/* Main button */}
        <button
          type="button"
          className={buttonClasses}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp} // Stop if pointer leaves button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Stop if mouse leaves button
          disabled={disabled || !isSupported}
          aria-label={state.isRecording ? 'Release to stop recording' : 'Hold to record voice input'}
        >
          {/* Button content */}
          <div className="pointer-events-none">
            {state.isProcessing ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-2xl sm:text-3xl md:text-4xl text-white">
                {state.isRecording ? '🎤' : '🎙️'}
              </span>
            )}
            
            {/* Recording duration indicator */}
            {state.isRecording && recordingDuration > 0 && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
                  {recordingDuration}s
                </div>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Status Text */}
      <div className="text-center max-w-sm px-4">
        {!isSupported ? (
          <p className="text-sm text-red-500 dark:text-red-400">
            Speech recognition not supported
          </p>
        ) : disabled ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Voice input disabled
          </p>
        ) : state.isProcessing ? (
          <p className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
            Processing your voice...
          </p>
        ) : state.isRecording ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Recording... Release to stop
            </p>
            {(state.interimTranscript || state.transcript) && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                <span className="text-gray-900 dark:text-gray-100">
                  {state.transcript}
                </span>
                <span className="text-gray-500 dark:text-gray-400 italic">
                  {state.interimTranscript}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant dark:text-gray-300">
            Hold the button to record your task or event
          </p>
        )}
      </div>

      {/* Waveform visualization placeholder */}
      {state.isRecording && (
        <div className="flex items-center justify-center space-x-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Tips for first-time users */}
      {!state.isRecording && !state.isProcessing && (
        <div className="text-center text-xs text-on-surface-variant dark:text-gray-400 max-w-xs space-y-1">
          <p>Try saying:</p>
          <p className="italic">"Dentist appointment tomorrow at 2pm"</p>
          <p className="italic">"Buy groceries at 5pm today"</p>
          <p className="italic">"Team meeting next Monday urgent"</p>
        </div>
      )}
    </div>
  );
}