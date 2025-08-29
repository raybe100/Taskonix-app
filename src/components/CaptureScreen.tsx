import { useState } from 'react';
import { VoiceCapture } from './VoiceCapture';
import { VoiceConfirmationSheet } from './VoiceConfirmationSheet';
import { ParsedVoiceInput, ItemFormData } from '../types';

interface CaptureScreenProps {
  onItemCreate: (itemData: ItemFormData) => Promise<void>;
  onNavigate?: (view: 'today' | 'calendar' | 'locations' | 'settings') => void;
  className?: string;
}

export function CaptureScreen({ onItemCreate, onNavigate, className = '' }: CaptureScreenProps) {
  const [voiceResult, setVoiceResult] = useState<ParsedVoiceInput | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleVoiceResult = (result: ParsedVoiceInput) => {
    setVoiceResult(result);
    setShowConfirmation(true);
    setError(null);
  };

  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage);
    setVoiceResult(null);
    setShowConfirmation(false);
  };

  const handleConfirmSave = async (itemData: ItemFormData) => {
    setIsCreating(true);
    try {
      console.log('💾 CaptureScreen calling onItemCreate with:', {
        title: itemData.title,
        type: itemData.type
      });
      
      await onItemCreate(itemData);
      
      // Only close confirmation if no errors occurred
      setShowConfirmation(false);
      setVoiceResult(null);
      setError(null);
      console.log('✅ CaptureScreen: Item creation completed successfully');
    } catch (err) {
      console.error('❌ CaptureScreen: Item creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmCancel = () => {
    setShowConfirmation(false);
    setVoiceResult(null);
    setError(null);
  };

  const handleConfirmEdit = () => {
    setShowConfirmation(false);
    // Keep the voice result for potential re-editing
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-40/10 dark:bg-accent-dark-gold/10 flex items-center justify-center">
          <span className="text-3xl">🎤</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Voice Capture
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Simply speak your task or event, and Taskonix will organize it for you
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        
        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-sm w-full">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-red-500 mr-3 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  <button
                    onClick={clearError}
                    className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Capture Component */}
        <VoiceCapture
          onVoiceResult={handleVoiceResult}
          onError={handleVoiceError}
          disabled={isCreating}
          className="mb-12"
        />

        {/* Features Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mt-16">
          <div className="text-center p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Parsing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI automatically extracts dates, times, locations, and priorities from your speech
            </p>
          </div>

          <div className="text-center p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Location Aware
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Recognizes places and can set location-based reminders for when you arrive
            </p>
          </div>

          <div className="text-center p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Reminders
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Automatically suggests when to remind you based on the task type and location
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="w-full max-w-md mt-12 px-4">
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur rounded-xl p-6">
            <h3 className="text-center text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  console.log('Quick action clicked: today');
                  onNavigate?.('today');
                }}
                className="p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors text-center"
              >
                <div className="text-xl mb-1">📅</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Today</div>
              </button>
              <button 
                onClick={() => onNavigate?.('calendar')}
                className="p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors text-center"
              >
                <div className="text-xl mb-1">🗓️</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Calendar</div>
              </button>
              <button 
                onClick={() => onNavigate?.('locations')}
                className="p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors text-center"
              >
                <div className="text-xl mb-1">📍</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Places</div>
              </button>
              <button 
                onClick={() => onNavigate?.('settings')}
                className="p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors text-center"
              >
                <div className="text-xl mb-1">⚙️</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Settings</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Confirmation Sheet */}
      {voiceResult && (
        <VoiceConfirmationSheet
          voiceInput={voiceResult}
          isOpen={showConfirmation}
          onSave={handleConfirmSave}
          onCancel={handleConfirmCancel}
          onEdit={handleConfirmEdit}
        />
      )}

      {/* Creating overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white">Creating your task...</p>
          </div>
        </div>
      )}
    </div>
  );
}