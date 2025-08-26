import { useState } from 'react';
import { TaskFormData } from '../types';
import { TaskTemplate, getAllTemplates, applyTemplate } from '../lib/templates';

interface TaskTemplatesProps {
  onApplyTemplate: (tasks: TaskFormData[]) => void;
}

export function TaskTemplates({ onApplyTemplate }: TaskTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const templates = getAllTemplates();

  const handleApplyTemplate = (template: TaskTemplate) => {
    const tasks = applyTemplate(template);
    onApplyTemplate(tasks);
    setSelectedTemplate(null);
    setIsExpanded(false);
  };

  return (
    <div className="card-elevated p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-large font-medium text-on-surface flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Task Templates
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-outlined-small"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <p className="text-body-medium text-on-surface-variant">
            Apply pre-built task collections for common workflows
          </p>

          <div className="grid gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="surface-container p-4 rounded-xl border border-outline-variant/20 hover:border-primary-40/30 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.emoji}</span>
                    <h4 className="text-title-medium font-medium text-on-surface">
                      {template.name}
                    </h4>
                  </div>
                  <span className="text-body-small text-on-surface-variant bg-surface-light-container px-2 py-1 rounded">
                    {template.tasks.length} tasks
                  </span>
                </div>

                {selectedTemplate?.id === template.id && (
                  <div className="mt-4 space-y-3 border-t border-outline-variant/20 pt-3">
                    <div className="space-y-2">
                      {template.tasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2 text-body-small">
                          <div className={`w-2 h-2 rounded-full ${{
                            High: 'bg-error-40',
                            Medium: 'bg-tertiary-40',
                            Low: 'bg-primary-40'
                          }[task.priority]}`} />
                          <span className="text-on-surface">{task.title}</span>
                          <span className="text-on-surface-variant">({task.durationMin}min)</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTemplate(template);
                        }}
                        className="btn-filled flex-1"
                      >
                        Apply Template
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(null);
                        }}
                        className="btn-outlined-small px-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="text-4xl mb-2 block">📝</span>
              <p className="text-body-medium">No templates available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}