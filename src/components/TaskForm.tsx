import React, { useState, useCallback } from 'react';
import { Priority, TaskFormData, DEFAULT_CATEGORIES, priorityLevelToLegacyPriority } from '../types';
import { parseVoiceInput, createSpeechRecognition, isSpeechRecognitionSupported } from '../lib/nlp';

interface TaskFormProps {
  onSubmit: (task: TaskFormData) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    priority: 'Medium',
    start: '',
    durationMin: 30,
    category: '',
    description: ''
  });
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => isSpeechRecognitionSupported());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      ...formData,
      title: formData.title.trim(),
      start: formData.start || undefined,
      durationMin: formData.durationMin || undefined
    });

    // Reset form
    setFormData({
      title: '',
      priority: 'Medium',
      start: '',
      durationMin: 30,
      category: '',
      description: ''
    });
  };

  const startVoiceInput = useCallback(() => {
    if (!speechSupported || isListening) return;

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseVoiceInput(transcript);
      
      setFormData(prev => ({
        ...prev,
        title: parsed.title,
        priority: parsed.priority ? priorityLevelToLegacyPriority(parsed.priority) : prev.priority,
        start: parsed.start || parsed.start_at || prev.start,
        durationMin: parsed.durationMin || prev.durationMin
      }));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [speechSupported, isListening]);

  return (
    <div className="card-elevated p-5 sm:p-6 animate-scale-in">
      <h2 className="text-headline-small text-on-surface mb-6">Add New Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Title Input with Voice */}
        <div className="relative">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-filled w-full peer"
                placeholder=" "
                required
              />
              <label 
                htmlFor="title" 
                className="absolute left-4 top-4 text-body-medium text-on-surface-variant transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-body-large peer-focus:top-2 peer-focus:text-label-medium peer-focus:text-primary-40"
              >
                Task Title *
              </label>
            </div>
            {speechSupported && (
              <button
                type="button"
                onClick={startVoiceInput}
                disabled={isListening}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 min-w-[48px] min-h-[48px] ${
                  isListening 
                    ? 'bg-error-40 text-white animate-pulse shadow-elevation-3' 
                    : 'bg-surface-light-container/80 text-primary-40 border border-primary-40/30 hover:bg-primary-40/10 hover:border-primary-40/50 shadow-elevation-1 hover:shadow-elevation-2'
                }`}
                title="Voice input"
              >
                <span className="text-lg sm:text-xl">{isListening ? '🔴' : '🎤'}</span>
              </button>
            )}
          </div>
          {isListening && (
            <div className="mt-2 ml-4 animate-fade-in">
              <p className="text-label-medium text-primary-40">
                Listening... Speak now!
              </p>
              <p className="text-label-small text-on-surface-variant opacity-75 mt-1">
                Try: "Team meeting next Monday 3pm high 90m" or "Call dentist Friday low"
              </p>
            </div>
          )}
        </div>

        {/* Priority Selection */}
        <div className="relative">
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
            className="input-filled w-full peer"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <label 
            htmlFor="priority" 
            className="absolute left-4 top-2 text-label-medium text-on-surface-variant"
          >
            Priority
          </label>
        </div>

        {/* Start DateTime */}
        <div className="relative">
          <input
            id="start"
            type="datetime-local"
            value={formData.start}
            onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
            className="input-filled w-full peer"
          />
          <label 
            htmlFor="start" 
            className="absolute left-4 top-2 text-label-medium text-on-surface-variant"
          >
            Start Date & Time (Optional)
          </label>
        </div>

        {/* Duration */}
        <div className="relative">
          <input
            id="duration"
            type="number"
            min="5"
            max="480"
            step="5"
            value={formData.durationMin}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              durationMin: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            className="input-filled w-full peer"
            placeholder="30"
          />
          <label 
            htmlFor="duration" 
            className="absolute left-4 top-2 text-label-medium text-on-surface-variant"
          >
            Duration (Minutes)
          </label>
        </div>

        {/* Category */}
        <div className="relative">
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="input-filled w-full peer"
          >
            <option value="">No Category</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
          <label 
            htmlFor="category" 
            className="absolute left-4 top-2 text-label-medium text-on-surface-variant"
          >
            Category
          </label>
        </div>

        {/* Description */}
        <div className="relative">
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input-filled w-full peer min-h-[80px] resize-none"
            placeholder=" "
          />
          <label 
            htmlFor="description" 
            className="absolute left-4 top-4 text-body-medium text-on-surface-variant transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-body-large peer-focus:top-2 peer-focus:text-label-medium peer-focus:text-primary-40"
          >
            Description (Optional)
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!formData.title.trim()}
          className="btn-filled w-full py-4 mt-6 sm:mt-8 disabled:opacity-50 disabled:cursor-not-allowed state-layer min-h-[48px] text-base font-medium"
        >
          Add Task
        </button>
      </form>

    </div>
  );
}