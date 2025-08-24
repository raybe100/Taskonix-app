import React, { useState, useCallback } from 'react';
import { Task, TaskFormData } from '../types';
import { 
  generateVoiceSuggestions, 
  analyzeProductivityPatterns, 
  VoiceSuggestion,
  createSpeechRecognition,
  isSpeechRecognitionSupported
} from '../lib/nlp';

interface SmartVoiceAssistantProps {
  tasks: Task[];
  onTaskCreate: (formData: TaskFormData) => void;
  onShowInsights: () => void;
}

export function SmartVoiceAssistant({ tasks, onTaskCreate, onShowInsights }: SmartVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [suggestions, setSuggestions] = useState<VoiceSuggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechSupported] = useState(() => isSpeechRecognitionSupported());

  const generateSuggestions = useCallback((input: string) => {
    const voiceSuggestions = generateVoiceSuggestions(tasks, input);
    setSuggestions(voiceSuggestions);
  }, [tasks]);

  const startListening = useCallback(() => {
    if (!speechSupported || isListening) return;

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    setIsListening(true);
    setCurrentInput('');
    setSuggestions([]);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentInput(transcript);
      generateSuggestions(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [speechSupported, isListening, generateSuggestions]);

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    generateSuggestions(value);
  };

  const applySuggestion = (suggestion: VoiceSuggestion) => {
    // This is a simplified implementation - in a real app, you'd apply the suggestion properly
    switch (suggestion.type) {
      case 'task':
        const taskMatch = suggestion.suggestion.match(/Continue with "(.+)"/);
        if (taskMatch) {
          setCurrentInput(taskMatch[1]);
        }
        break;
      case 'priority':
      case 'category':
      case 'time':
        // Add the suggestion to current input
        setCurrentInput(prev => `${prev} ${suggestion.suggestion.toLowerCase()}`);
        break;
    }
  };

  const { insights, recommendations } = analyzeProductivityPatterns(tasks);

  if (!speechSupported) {
    return null;
  }

  return (
    <div className="card-elevated p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-large font-medium text-on-surface flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          Smart Voice Assistant
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-outlined-small"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Voice Input Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Say or type your task..."
            className="flex-1 p-3 rounded-lg border border-outline-variant bg-surface-light focus:border-primary-40 focus:ring-1 focus:ring-primary-40 text-on-surface"
          />
          <button
            onClick={startListening}
            disabled={isListening}
            className={`p-3 rounded-lg transition-all duration-200 ${
              isListening 
                ? 'bg-error-40 text-white animate-pulse' 
                : 'bg-primary-40 text-on-primary hover:bg-primary-40/90'
            }`}
          >
            <span className="text-lg">{isListening ? '🔴' : '🎤'}</span>
          </button>
        </div>

        {/* Live Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-body-medium font-medium text-on-surface">💡 Smart Suggestions:</h4>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="w-full p-3 text-left surface-container rounded-lg hover:bg-primary-40/5 transition-colors border border-outline-variant/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body-medium text-on-surface font-medium">
                    {suggestion.suggestion}
                  </span>
                  <span className="text-body-small text-primary-40 font-medium">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
                <div className="text-body-small text-on-surface-variant">
                  {suggestion.reasoning}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-6 border-t border-outline-variant/20 pt-4 mt-4">
          {/* Productivity Insights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-title-medium font-medium text-on-surface">
                📊 Productivity Insights
              </h4>
              <button
                onClick={onShowInsights}
                className="text-body-small text-primary-40 hover:text-primary-40/80"
              >
                View Details
              </button>
            </div>
            
            <div className="space-y-2">
              {insights.slice(0, 2).map((insight, index) => (
                <div key={index} className="p-3 surface-container rounded-lg">
                  <div className="text-body-medium text-on-surface mb-1">
                    ✓ {insight}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <h4 className="text-title-medium font-medium text-on-surface mb-3">
              🎯 AI Recommendations
            </h4>
            <div className="space-y-2">
              {recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="p-3 bg-primary-40/5 border border-primary-40/20 rounded-lg">
                  <div className="text-body-medium text-primary-40">
                    💡 {rec}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Command Quick Actions */}
          <div>
            <h4 className="text-title-medium font-medium text-on-surface mb-3">
              🎙️ Quick Voice Commands
            </h4>
            <div className="grid grid-cols-2 gap-2 text-body-small">
              <button
                onClick={() => handleInputChange('Show me my tasks for today')}
                className="p-3 surface-container rounded-lg hover:bg-primary-40/5 transition-colors text-left"
              >
                <div className="text-on-surface font-medium">Today's Tasks</div>
                <div className="text-on-surface-variant">Show today's schedule</div>
              </button>
              
              <button
                onClick={() => handleInputChange('Create high priority meeting tomorrow 2pm')}
                className="p-3 surface-container rounded-lg hover:bg-primary-40/5 transition-colors text-left"
              >
                <div className="text-on-surface font-medium">Quick Meeting</div>
                <div className="text-on-surface-variant">Schedule meeting</div>
              </button>
              
              <button
                onClick={() => handleInputChange('Personal task low priority')}
                className="p-3 surface-container rounded-lg hover:bg-primary-40/5 transition-colors text-left"
              >
                <div className="text-on-surface font-medium">Personal Task</div>
                <div className="text-on-surface-variant">Add personal item</div>
              </button>
              
              <button
                onClick={() => handleInputChange('Work task high priority 1 hour')}
                className="p-3 surface-container rounded-lg hover:bg-primary-40/5 transition-colors text-left"
              >
                <div className="text-on-surface font-medium">Work Task</div>
                <div className="text-on-surface-variant">Add work item</div>
              </button>
            </div>
          </div>

          {/* Current Status */}
          <div className="surface-container p-4 rounded-xl">
            <div className="text-title-small font-medium text-on-surface mb-2">
              📈 Your Productivity Today
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-title-medium font-medium text-primary-40">
                  {tasks.length}
                </div>
                <div className="text-body-small text-on-surface-variant">Total Tasks</div>
              </div>
              <div>
                <div className="text-title-medium font-medium text-secondary-40">
                  {tasks.filter(t => t.priority === 'High').length}
                </div>
                <div className="text-body-small text-on-surface-variant">High Priority</div>
              </div>
              <div>
                <div className="text-title-medium font-medium text-tertiary-40">
                  {Math.round((tasks.filter(t => t.start).length / Math.max(tasks.length, 1)) * 100)}%
                </div>
                <div className="text-body-small text-on-surface-variant">Scheduled</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}