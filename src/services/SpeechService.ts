import { SpeechRecognitionResult, SpeechRecognitionOptions } from '../types';

export interface SpeechServiceCallbacks {
  onResult: (result: SpeechRecognitionResult) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private callbacks: SpeechServiceCallbacks | null = null;
  private finalTranscript = '';
  private interimTranscript = '';
  private confidenceScore = 0;
  
  // Check if speech recognition is supported
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  // Check permissions
  static async checkPermissions(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the stream to clean up
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.warn('Microphone access denied:', error);
      return false;
    }
  }

  // Request permissions with better error handling
  static async requestPermissions(): Promise<{ granted: boolean; error?: string }> {
    try {
      const hasPermission = await SpeechService.checkPermissions();
      if (!hasPermission) {
        return { 
          granted: false, 
          error: 'Microphone access is required for voice input. Please enable it in your browser settings.' 
        };
      }
      return { granted: true };
    } catch (error) {
      return { 
        granted: false, 
        error: error instanceof Error ? error.message : 'Unknown permission error' 
      };
    }
  }

  // Initialize the speech recognition service
  initialize(options: Partial<SpeechRecognitionOptions> = {}): boolean {
    if (!SpeechService.isSupported()) {
      console.error('Speech recognition not supported');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    const defaultOptions: SpeechRecognitionOptions = {
      continuous: true,
      interim_results: true,
      language: 'en-US',
      max_alternatives: 1
    };

    const config = { ...defaultOptions, ...options };
    
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interim_results;
    this.recognition.lang = config.language;
    this.recognition.maxAlternatives = config.max_alternatives;

    // Set up event handlers
    this.setupEventHandlers();
    
    return true;
  }

  // Set up all event handlers
  private setupEventHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.confidenceScore = 0;
      this.callbacks?.onStart();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newFinalTranscript = '';
      let newInterimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        if (result.isFinal) {
          newFinalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          newInterimTranscript += transcript;
        }
      }

      // Update state
      if (newFinalTranscript) {
        this.finalTranscript += newFinalTranscript;
        this.confidenceScore = Math.max(this.confidenceScore, maxConfidence);
      }
      
      this.interimTranscript = newInterimTranscript;

      // Emit result
      const fullTranscript = (this.finalTranscript + this.interimTranscript).trim();
      if (fullTranscript) {
        this.callbacks?.onResult({
          transcript: fullTranscript,
          confidence: this.confidenceScore || maxConfidence || 0.8,
          is_final: newFinalTranscript.length > 0
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      
      let errorMessage = 'Speech recognition failed';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly and try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please ensure you have a working microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable microphone permissions and refresh the page.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed. This might be due to browser restrictions.';
          break;
        case 'bad-grammar':
          errorMessage = 'Speech recognition grammar error.';
          break;
        case 'language-not-supported':
          errorMessage = 'The selected language is not supported.';
          break;
        case 'aborted':
          // Normal termination, don't show error
          return;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.isListening = false;
      this.callbacks?.onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks?.onEnd();
    };

    this.recognition.onnomatch = () => {
      this.callbacks?.onError('No speech match found. Please try speaking more clearly.');
    };

    this.recognition.onsoundstart = () => {
      console.debug('Sound detection started');
    };

    this.recognition.onsoundend = () => {
      console.debug('Sound detection ended');
    };

    this.recognition.onspeechstart = () => {
      console.debug('Speech detection started');
    };

    this.recognition.onspeechend = () => {
      console.debug('Speech detection ended');
    };
  }

  // Start listening
  async start(callbacks: SpeechServiceCallbacks): Promise<boolean> {
    if (!this.recognition) {
      callbacks.onError('Speech service not initialized');
      return false;
    }

    if (this.isListening) {
      callbacks.onError('Already listening');
      return false;
    }

    // Check permissions first
    const permissionResult = await SpeechService.requestPermissions();
    if (!permissionResult.granted) {
      callbacks.onError(permissionResult.error || 'Permission denied');
      return false;
    }

    this.callbacks = callbacks;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start speech recognition';
      callbacks.onError(errorMessage);
      return false;
    }
  }

  // Stop listening
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Abort listening immediately
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Get current state
  getState() {
    return {
      isListening: this.isListening,
      finalTranscript: this.finalTranscript,
      interimTranscript: this.interimTranscript,
      confidence: this.confidenceScore,
      isSupported: SpeechService.isSupported()
    };
  }

  // Get final transcript
  getFinalTranscript(): string {
    return this.finalTranscript.trim();
  }

  // Get confidence score
  getConfidence(): number {
    return this.confidenceScore;
  }

  // Clean up resources
  destroy(): void {
    if (this.recognition) {
      this.abort();
      this.recognition = null;
    }
    this.callbacks = null;
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.confidenceScore = 0;
  }

  // Utility: Test microphone access
  static async testMicrophone(): Promise<{ working: boolean; error?: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Test if we can actually get audio data
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      source.connect(analyzer);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      await audioContext.close();
      
      return { working: true };
    } catch (error) {
      return {
        working: false,
        error: error instanceof Error ? error.message : 'Microphone test failed'
      };
    }
  }

  // Utility: Get available languages (if supported by browser)
  static getAvailableLanguages(): string[] {
    // Common language codes for speech recognition
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA',
      'es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'de-DE', 'it-IT', 'pt-BR',
      'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ar-SA', 'hi-IN'
    ];
  }

  // Utility: Auto-detect language based on user's locale
  static detectLanguage(): string {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const locale = navigator.language;
      const availableLanguages = SpeechService.getAvailableLanguages();
      
      // Try exact match first
      if (availableLanguages.includes(locale)) {
        return locale;
      }
      
      // Try language without region
      const langOnly = locale.split('-')[0];
      const matchingLang = availableLanguages.find(lang => 
        lang.startsWith(langOnly + '-')
      );
      
      return matchingLang || 'en-US';
    }
    
    return 'en-US';
  }
}

// Singleton instance for easy use
export const speechService = new SpeechService();

// Global type declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}