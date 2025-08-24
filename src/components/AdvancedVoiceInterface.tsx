import React, { useState, useCallback } from 'react';
import { Task, TaskFormData } from '../types';
import { 
  parseVoiceCommand, 
  findTasksByTitle,
  createSpeechRecognition, 
  isSpeechRecognitionSupported 
} from '../lib/nlp';

interface AdvancedVoiceInterfaceProps {
  tasks: Task[];
  onTaskCreate: (formData: TaskFormData) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskSearch?: (searchTerm: string) => void;
}

export function AdvancedVoiceInterface({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskSearch
}: AdvancedVoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [speechSupported] = useState(() => isSpeechRecognitionSupported());

  const showFeedback = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 4000);
  }, []);

  const executeVoiceCommand = useCallback((command: any) => {
    setLastCommand(command.type);

    switch (command.type) {
      case 'create':
        if (command.updates) {
          onTaskCreate({
            title: command.updates.title,
            priority: command.updates.priority || 'Medium',
            start: command.updates.start,
            durationMin: command.updates.durationMin,
            category: command.updates.category,
            description: command.updates.description
          });
          showFeedback(`Created task: "${command.updates.title}"`, 'success');
        }
        break;

      case 'edit':
        if (command.taskIdentifier && command.updates) {
          const matchingTasks = findTasksByTitle(tasks, command.taskIdentifier);
          if (matchingTasks.length > 0) {
            const task = matchingTasks[0];
            const updates: Partial<Task> = {};
            
            if (command.updates.title) updates.title = command.updates.title;
            if (command.updates.priority) updates.priority = command.updates.priority;
            if (command.updates.start) updates.start = command.updates.start;
            if (command.updates.durationMin) updates.durationMin = command.updates.durationMin;
            if (command.updates.category) updates.category = command.updates.category;
            if (command.updates.description) updates.description = command.updates.description;

            onTaskUpdate(task.id, updates);
            showFeedback(`Updated task: "${task.title}"`, 'success');
          } else {
            showFeedback(`Task "${command.taskIdentifier}" not found`, 'error');
          }
        }
        break;

      case 'delete':
        if (command.taskIdentifier) {
          const matchingTasks = findTasksByTitle(tasks, command.taskIdentifier);
          if (matchingTasks.length > 0) {
            const task = matchingTasks[0];
            onTaskDelete(task.id);
            showFeedback(`Deleted task: "${task.title}"`, 'success');
          } else {
            showFeedback(`Task "${command.taskIdentifier}" not found`, 'error');
          }
        }
        break;

      case 'complete':
        if (command.taskIdentifier) {
          const matchingTasks = findTasksByTitle(tasks, command.taskIdentifier);
          if (matchingTasks.length > 0) {
            const task = matchingTasks[0];
            onTaskDelete(task.id); // For now, completing = deleting
            showFeedback(`Completed task: "${task.title}"`, 'success');
          } else {
            showFeedback(`Task "${command.taskIdentifier}" not found`, 'error');
          }
        }
        break;

      case 'move':
        if (command.taskIdentifier && command.newDate) {
          const matchingTasks = findTasksByTitle(tasks, command.taskIdentifier);
          if (matchingTasks.length > 0) {
            const task = matchingTasks[0];
            onTaskUpdate(task.id, { start: command.newDate });
            showFeedback(`Moved task "${task.title}" to ${new Date(command.newDate).toLocaleDateString()}`, 'success');
          } else {
            showFeedback(`Task "${command.taskIdentifier}" not found`, 'error');
          }
        }
        break;

      case 'search':
        if (command.newDate) {
          onTaskSearch?.(command.newDate);
          showFeedback(`Searching for tasks: ${command.newDate}`, 'info');
        }
        break;

      default:
        showFeedback('Command not recognized', 'error');
    }
  }, [tasks, onTaskCreate, onTaskUpdate, onTaskDelete, onTaskSearch, showFeedback]);

  const startAdvancedVoiceInput = useCallback(() => {
    if (!speechSupported || isListening) return;

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    setIsListening(true);
    setFeedback('');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const command = parseVoiceCommand(transcript);
      
      if (command) {
        executeVoiceCommand(command);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      showFeedback('Voice recognition error', 'error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [speechSupported, isListening, executeVoiceCommand, showFeedback]);

  if (!speechSupported) {
    return null;
  }

  return (
    <div className="card-elevated p-6 animate-scale-in">
      <h3 className="text-title-large font-medium text-on-surface mb-6 flex items-center gap-2">
        <span className="text-2xl">🎙️</span>
        Advanced Voice Commands
      </h3>

      <div className="space-y-4">
        {/* Voice Command Button */}
        <button
          onClick={startAdvancedVoiceInput}
          disabled={isListening}
          className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 ${
            isListening 
              ? 'bg-error-40 text-white animate-pulse shadow-elevation-3' 
              : 'bg-primary-40 text-on-primary hover:bg-primary-40/90 shadow-elevation-2 hover:shadow-elevation-3'
          }`}
        >
          <span className="text-2xl">{isListening ? '🔴' : '🎤'}</span>
          <span className="text-title-medium font-medium">
            {isListening ? 'Listening for commands...' : 'Voice Command'}
          </span>
        </button>

        {/* Feedback */}
        {feedback && (
          <div className={`p-3 rounded-lg text-body-medium ${
            feedback.includes('error') || feedback.includes('not found')
              ? 'bg-error-40/10 text-error-40 border border-error-40/20'
              : feedback.includes('success') || feedback.includes('Created') || feedback.includes('Updated')
              ? 'bg-primary-40/10 text-primary-40 border border-primary-40/20'
              : 'bg-secondary-40/10 text-secondary-40 border border-secondary-40/20'
          }`}>
            {feedback}
          </div>
        )}

        {/* Command Examples */}
        <div className="space-y-3">
          <h4 className="text-title-medium font-medium text-on-surface">Try these commands:</h4>
          
          <div className="grid gap-2 text-body-small text-on-surface-variant">
            <div className="p-3 surface-container rounded-lg">
              <div className="font-medium text-on-surface mb-1">📝 Create Tasks</div>
              <div>"Team meeting tomorrow 3pm high 60 minutes"</div>
              <div>"Call dentist low personal"</div>
            </div>
            
            <div className="p-3 surface-container rounded-lg">
              <div className="font-medium text-on-surface mb-1">✏️ Edit Tasks</div>
              <div>"Edit team meeting to be high priority"</div>
              <div>"Change dentist call to tomorrow 2pm"</div>
            </div>
            
            <div className="p-3 surface-container rounded-lg">
              <div className="font-medium text-on-surface mb-1">🗑️ Delete/Complete</div>
              <div>"Delete dentist appointment"</div>
              <div>"Complete team meeting"</div>
            </div>
            
            <div className="p-3 surface-container rounded-lg">
              <div className="font-medium text-on-surface mb-1">📅 Move Tasks</div>
              <div>"Move team meeting to Friday"</div>
              <div>"Reschedule dentist call to next week"</div>
            </div>
            
            <div className="p-3 surface-container rounded-lg">
              <div className="font-medium text-on-surface mb-1">🔍 Search Tasks</div>
              <div>"Show tasks for tomorrow"</div>
              <div>"What do I have on Monday"</div>
            </div>
          </div>
        </div>

        {/* Last Command */}
        {lastCommand && (
          <div className="text-center text-body-small text-on-surface-variant">
            Last command: <span className="font-medium text-primary-40">{lastCommand}</span>
          </div>
        )}
      </div>
    </div>
  );
}