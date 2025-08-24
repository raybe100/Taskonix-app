import { useState, useCallback, memo } from 'react';
import { Task, TaskFormData } from '../types';
import { 
  generateCalendarMonth,
  getCalendarNavigation,
  getPreviousMonth,
  getNextMonth,
  createTaskForDateTime,
  getDayPrioritySummary,
  formatCalendarTime,
  getPriorityColor
} from '../lib/calendarUtils';
import { format } from 'date-fns';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
  onTaskCreate?: (formData: TaskFormData) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

export function Calendar({ tasks, onTaskClick, onDateClick, onTaskCreate, onTaskDelete, onTaskUpdate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quickEditingDate, setQuickEditingDate] = useState<Date | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  
  const calendarMonth = generateCalendarMonth(currentDate, tasks);
  const navigation = getCalendarNavigation(currentDate);
  
  const handleQuickAddTask = useCallback((date: Date) => {
    if (!onTaskCreate) return;
    
    // Start inline editing mode
    setQuickEditingDate(date);
    setQuickEditTitle('');
    setSelectedDate(date);
    onDateClick?.(date);
  }, [onTaskCreate, onDateClick]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
    
    // Also trigger quick add task popup
    if (onTaskCreate) {
      handleQuickAddTask(date);
    }
  }, [onDateClick, onTaskCreate, handleQuickAddTask]);
  
  const handleTaskClick = useCallback((task: Task, event: React.MouseEvent) => {
    event.stopPropagation();
    onTaskClick?.(task);
  }, [onTaskClick]);
  
  const handlePreviousMonth = () => {
    if (navigation.canGoBack) {
      setCurrentDate(getPreviousMonth(currentDate));
    }
  };
  
  const handleNextMonth = () => {
    if (navigation.canGoForward) {
      setCurrentDate(getNextMonth(currentDate));
    }
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const handleMonthYearSelect = (year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleQuickSaveTask = useCallback(() => {
    if (!onTaskCreate || !quickEditingDate || !quickEditTitle.trim()) return;
    
    const taskDateTime = createTaskForDateTime(quickEditingDate);
    
    onTaskCreate({
      title: quickEditTitle.trim(),
      priority: 'Medium',
      start: taskDateTime,
      durationMin: 30
    });

    // Reset editing state
    setQuickEditingDate(null);
    setQuickEditTitle('');
  }, [onTaskCreate, quickEditingDate, quickEditTitle]);

  const handleQuickCancelEdit = useCallback(() => {
    setQuickEditingDate(null);
    setQuickEditTitle('');
  }, []);

  const handleTaskDragStart = useCallback((task: Task, event: React.DragEvent) => {
    setDraggedTask(task);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  }, []);

  const handleDateDragOver = useCallback((date: Date, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  }, []);

  const handleDateDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDateDrop = useCallback((date: Date, event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedTask || !onTaskUpdate) return;
    
    // Create new date/time for the task
    const newDateTime = createTaskForDateTime(date);
    
    // Update the task with new start time
    onTaskUpdate(draggedTask.id, {
      start: newDateTime
    });
    
    // Reset drag state
    setDraggedTask(null);
    setDragOverDate(null);
  }, [draggedTask, onTaskUpdate]);

  return (
    <div className="card-elevated p-6 animate-scale-in">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-headline-small text-on-surface">
          {navigation.currentMonth}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTodayClick}
            className="btn-outlined px-4 py-2 text-label-medium"
          >
            Today
          </button>
          <button
            onClick={handlePreviousMonth}
            disabled={!navigation.canGoBack}
            className="btn-outlined p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous month"
          >
            <span className="text-lg">‹</span>
          </button>
          <button
            onClick={handleNextMonth}
            disabled={!navigation.canGoForward}
            className="btn-outlined p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next month"
          >
            <span className="text-lg">›</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day Headers */}
        {DAY_HEADERS.map(day => (
          <div key={day} className="p-3 text-center">
            <span className="text-label-medium font-medium text-on-surface-variant">
              {day}
            </span>
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarMonth.weeks.map((week, weekIndex) =>
          week.days.map((day, dayIndex) => (
            <CalendarDay
              key={`${weekIndex}-${dayIndex}`}
              day={day}
              isSelected={selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd') : false}
              isDragOver={dragOverDate ? format(dragOverDate, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd') : false}
              onDateClick={handleDateClick}
              onTaskClick={handleTaskClick}
              onQuickAdd={handleQuickAddTask}
              onTaskDragStart={handleTaskDragStart}
              onDateDragOver={handleDateDragOver}
              onDateDragLeave={handleDateDragLeave}
              onDateDrop={handleDateDrop}
            />
          ))
        )}
      </div>


      {/* Quick Task Editor Modal */}
      {quickEditingDate && (
        <div className="fixed inset-0 bg-surface-light flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-6 max-w-md w-full animate-scale-in border border-outline-variant/20">
            <h3 className="text-title-medium font-medium text-on-surface mb-4">
              {format(quickEditingDate, 'EEEE, MMMM d')}
            </h3>
            
            {/* Existing Tasks */}
            {(() => {
              const dayTasks = tasks.filter(task => 
                task.start && format(new Date(task.start), 'yyyy-MM-dd') === format(quickEditingDate, 'yyyy-MM-dd')
              );
              
              return dayTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-label-large font-medium text-on-surface mb-3">Existing Tasks</h4>
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 surface-container rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-body-medium text-on-surface truncate">{task.title}</p>
                          <p className="text-body-small text-on-surface-variant">
                            {task.start && format(new Date(task.start), 'h:mm a')} • {task.priority}
                          </p>
                        </div>
                        {onTaskDelete && (
                          <button
                            onClick={() => {
                              onTaskDelete(task.id);
                              // Close modal if no more tasks for this date
                              const remainingTasks = dayTasks.filter(t => t.id !== task.id);
                              if (remainingTasks.length === 0) {
                                handleQuickCancelEdit();
                              }
                            }}
                            className="text-error-40 hover:bg-error-40/10 p-2 rounded-full transition-colors ml-2"
                            title="Delete task"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Add New Task */}
            <div className="space-y-4">
              <h4 className="text-label-large font-medium text-on-surface">Add New Task</h4>
              <div className="relative">
                <input
                  type="text"
                  value={quickEditTitle}
                  onChange={(e) => setQuickEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickSaveTask();
                    } else if (e.key === 'Escape') {
                      handleQuickCancelEdit();
                    }
                  }}
                  className="input-filled w-full peer"
                  placeholder=" "
                  autoFocus
                  required
                />
                <label className="absolute left-4 top-4 text-body-medium text-on-surface-variant transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-body-large peer-focus:top-2 peer-focus:text-label-medium peer-focus:text-primary-40">
                  Task title *
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleQuickSaveTask}
                  disabled={!quickEditTitle.trim()}
                  className="btn-filled flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Task
                </button>
                <button
                  onClick={handleQuickCancelEdit}
                  className="btn-outlined"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CalendarDayProps {
  day: {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: Task[];
    dayNumber: number;
  };
  isSelected: boolean;
  isDragOver: boolean;
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onQuickAdd: (date: Date) => void;
  onTaskDragStart: (task: Task, event: React.DragEvent) => void;
  onDateDragOver: (date: Date, event: React.DragEvent) => void;
  onDateDragLeave: () => void;
  onDateDrop: (date: Date, event: React.DragEvent) => void;
}

const CalendarDay = memo(function CalendarDay({ 
  day, 
  isSelected, 
  isDragOver,
  onDateClick, 
  onTaskClick, 
  onQuickAdd,
  onTaskDragStart,
  onDateDragOver,
  onDateDragLeave,
  onDateDrop
}: CalendarDayProps) {
  const prioritySummary = getDayPrioritySummary(day.tasks);
  const hasEvents = day.tasks.length > 0;
  
  const dayClasses = [
    'relative p-2 min-h-[80px] border rounded-lg transition-all duration-200 cursor-pointer state-layer group',
    // Current month vs other months
    day.isCurrentMonth 
      ? 'bg-surface-light-container/30 hover:bg-surface-light-container/50 border-outline-variant/10' 
      : 'bg-surface-light-container/10 text-on-surface-variant opacity-30 border-outline-variant/5',
    // Today highlighting - much more subtle
    day.isToday && 'ring-1 ring-primary-40/50 bg-primary-95/20',
    // Selected state - much more subtle
    isSelected && 'ring-1 ring-primary-40/70 bg-primary-90/30',
    // Drag over state
    isDragOver && 'ring-2 ring-secondary-40 bg-secondary-95/40',
    // Events indicator
    hasEvents && 'hover:shadow-sm'
  ].join(' ');

  return (
    <div
      className={dayClasses}
      onClick={() => onDateClick(day.date)}
      onDragOver={(e) => onDateDragOver(day.date, e)}
      onDragLeave={onDateDragLeave}
      onDrop={(e) => onDateDrop(day.date, e)}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-label-large font-semibold ${
          day.isToday ? 'text-primary-40' : 'text-on-surface'
        }`}>
          {day.dayNumber}
        </span>
        
        {/* Quick Add Button */}
        {day.isCurrentMonth && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(day.date);
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-surface-light-container/60 text-primary-40 border border-primary-40/40 flex items-center justify-center text-xs hover:bg-primary-40/10 hover:border-primary-40/60 transition-all duration-200"
            title="Quick add task"
          >
            +
          </button>
        )}
      </div>

      {/* Task Indicators */}
      <div className="space-y-1">
        {day.tasks.slice(0, 3).map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            onTaskDragStart={onTaskDragStart}
          />
        ))}
        
        
        {/* More tasks indicator */}
        {day.tasks.length > 3 && (
          <div className="text-xs text-on-surface-variant text-center py-1">
            +{day.tasks.length - 3} more
          </div>
        )}
        
        {/* Priority dots when no space for task cards */}
        {day.tasks.length > 0 && (
          <div className="flex justify-center gap-1 mt-2">
            {prioritySummary.high > 0 && (
              <div className="w-2 h-2 rounded-full bg-priority-high" title={`${prioritySummary.high} high priority tasks`} />
            )}
            {prioritySummary.medium > 0 && (
              <div className="w-2 h-2 rounded-full bg-priority-medium" title={`${prioritySummary.medium} medium priority tasks`} />
            )}
            {prioritySummary.low > 0 && (
              <div className="w-2 h-2 rounded-full bg-priority-low" title={`${prioritySummary.low} low priority tasks`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface TaskItemProps {
  task: Task;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onTaskDragStart: (task: Task, event: React.DragEvent) => void;
}

const TaskItem = memo(function TaskItem({ task, onTaskClick, onTaskDragStart }: TaskItemProps) {
  const [isDragStarted, setIsDragStarted] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragStarted(true);
    onTaskDragStart(task, e);
  };

  const handleDragEnd = () => {
    // Reset drag state after a brief delay to prevent click from firing
    setTimeout(() => setIsDragStarted(false), 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if we haven't just finished dragging
    if (!isDragStarted) {
      onTaskClick(task, e);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`px-1.5 py-0.5 rounded text-xs truncate cursor-move hover:opacity-80 transition-all duration-200 hover:scale-105 active:scale-95 select-none ${
        getPriorityColor(task.priority)
      }`}
      title={`${task.title} ${task.start ? `at ${formatCalendarTime(task.start)}` : ''} - Drag to reschedule`}
    >
      <div className="flex items-center gap-1">
        {task.start && (
          <span className="text-[10px] opacity-90">
            {formatCalendarTime(task.start)}
          </span>
        )}
        <span className="truncate flex-1">
          {task.title}
        </span>
      </div>
    </div>
  );
});

export default CalendarDay;