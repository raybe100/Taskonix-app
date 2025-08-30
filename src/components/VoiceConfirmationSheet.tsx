import { useState, useEffect } from 'react';
import { ParsedVoiceInput, ItemFormData, ItemType, PriorityLevel, PRIORITY_LABELS, DEFAULT_CATEGORIES } from '../types';

interface VoiceConfirmationSheetProps {
  voiceInput: ParsedVoiceInput;
  isOpen: boolean;
  onSave: (itemData: ItemFormData) => void;
  onCancel: () => void;
  onEdit: () => void;
}

export function VoiceConfirmationSheet({
  voiceInput,
  isOpen,
  onSave,
  onCancel,
  onEdit
}: VoiceConfirmationSheetProps) {
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    notes: '',
    type: 'task',
    priority: 3,
    tags: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Initialize form data from voice input
  useEffect(() => {
    if (voiceInput && isOpen) {
      setFormData({
        title: voiceInput.title,
        notes: voiceInput.notes || '',
        type: voiceInput.type || 'task',
        start_at: voiceInput.start_at,
        end_at: voiceInput.end_at,
        all_day: voiceInput.all_day || false,
        due_at: voiceInput.due_at,
        location_name: voiceInput.location_name,
        priority: voiceInput.priority || 3,
        tags: voiceInput.tags || [],
        category: voiceInput.category,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [voiceInput, isOpen]);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  const handleFieldChange = (field: keyof ItemFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Sheet */}
      <div className="relative min-h-screen flex items-end sm:items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Confirm Task
              </h2>
              {voiceInput.confidence && (
                <p className={`text-sm ${getConfidenceColor(voiceInput.confidence)}`}>
                  {Math.round(voiceInput.confidence * 100)}% confident
                </p>
              )}
            </div>
            
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
            
            {/* Original voice input */}
            {voiceInput.raw_text && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  You said:
                </h3>
                <p className="text-blue-800 dark:text-blue-200 italic">
                  "{voiceInput.raw_text}"
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="What needs to be done?"
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="flex space-x-3">
                {(['task', 'event'] as ItemType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFieldChange('type', type)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      formData.type === type
                        ? 'bg-primary-40 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type === 'task' ? '📝 Task' : '📅 Event'}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleFieldChange('priority', Number(e.target.value) as PriorityLevel)}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {Object.entries(PRIORITY_LABELS).map(([level, label]) => (
                  <option key={level} value={level}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time fields */}
            {formData.type === 'event' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at ? formData.start_at.slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('start_at', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-4 py-3 pr-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm datetime-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at ? formData.end_at.slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('end_at', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-4 py-3 pr-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm datetime-input"
                  />
                </div>
              </div>
            )}

            {formData.type === 'task' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_at ? formData.due_at.slice(0, 16) : ''}
                  onChange={(e) => handleFieldChange('due_at', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full px-4 py-3 pr-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm datetime-input"
                />
              </div>
            )}

            {/* Location */}
            {formData.location_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => handleFieldChange('location_name', e.target.value)}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Where will this happen?"
                />
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category (Optional)
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleFieldChange('category', e.target.value || undefined)}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select category...</option>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add any additional details..."
              />
            </div>

            {/* Tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      #{tag}
                      <button
                        onClick={() => {
                          const newTags = formData.tags?.filter((_, i) => i !== index) || [];
                          handleFieldChange('tags', newTags);
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t dark:border-gray-700">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={onEdit}
              className="py-3 px-4 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              🎤 Re-record
            </button>
            
            <button
              onClick={handleSave}
              disabled={!formData.title.trim()}
              className="flex-1 py-3 px-4 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}