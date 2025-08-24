import { useState, useCallback, memo } from 'react';
import { Task, TaskFormData } from '../types';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  isToday
} from 'date-fns';
import { getPriorityColor } from '../lib/calendarUtils';
import { getCategoryDisplay, getCategoryBadgeStyle } from '../lib/categoryUtils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarWeekViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
  onTaskCreate?: (formData: TaskFormData) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  tasks: Task[];
}

function generateWeekDays(currentDate: Date, tasks: Task[]): WeekDay[] {
  const startWeek = startOfWeek(currentDate);
  const endWeek = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: startWeek, end: endWeek });
  
  return weekDays.map((date, index) => {
    const dayTasks = tasks.filter(task => {
      if (!task.start) return false;
      try {
        return isSameDay(parseISO(task.start), date);
      } catch {
        return false;
      }
    }).sort((a, b) => {
      if (!a.start || !b.start) return 0;
      return parseISO(a.start).getTime() - parseISO(b.start).getTime();
    });

    return {
      date,
      dayName: WEEK_DAYS[index],
      dayNumber: date.getDate(),
      isToday: isToday(date),
      tasks: dayTasks
    };
  });
}

function getTasksForHour(tasks: Task[], hour: number): Task[] {
  return tasks.filter(task => {
    if (!task.start) return false;
    try {
      const taskHour = parseISO(task.start).getHours();
      const taskDuration = task.durationMin || 30;
      const taskEndHour = Math.ceil((taskHour * 60 + parseISO(task.start).getMinutes() + taskDuration) / 60);
      return hour >= taskHour && hour < taskEndHour;
    } catch {
      return false;
    }
  });
}

const TaskBlock = memo(function TaskBlock({ 
  task, 
  onClick 
}: { 
  task: Task; 
  onClick: (task: Task) => void;
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(task);
  }, [task, onClick]);

  const startTime = task.start ? format(parseISO(task.start), 'h:mm a') : '';
  const duration = task.durationMin || 30;
  const categoryDisplay = getCategoryDisplay(task.category);
  
  return (
    <div
      onClick={handleClick}
      className={`${getPriorityColor(task.priority)} rounded-lg p-2 mb-1 cursor-pointer 
        hover:shadow-elevation-2 transition-all duration-200 text-xs`}
      style={{ 
        minHeight: `${Math.max(duration / 15, 2)}rem` // Scale based on duration
      }}
    >
      <div className="font-medium truncate">{task.title}</div>
      <div className="opacity-90 text-xs">{startTime}</div>
      {categoryDisplay && (
        <div 
          className="inline-block px-1.5 py-0.5 rounded text-xs mt-1 opacity-90"
          style={getCategoryBadgeStyle(task.category)}
        >
          {categoryDisplay}
        </div>
      )}
      {duration > 30 && (
        <div className="opacity-75 text-xs mt-1">{duration}m</div>
      )}
    </div>
  );
});

export function CalendarWeekView({ 
  tasks, 
  onTaskClick, 
  onDateClick, 
  onTaskCreate, 
  onTaskDelete, 
  onTaskUpdate 
}: CalendarWeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekDays = generateWeekDays(currentDate, tasks);
  
  const handlePreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };
  
  const handleNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };
  
  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };
  
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const slotDateTime = setMinutes(setHours(date, hour), 0);
    onDateClick?.(slotDateTime);
    
    if (onTaskCreate) {
      const taskDateTime = format(slotDateTime, "yyyy-MM-dd'T'HH:mm");
      onTaskCreate({
        title: `New Task`,
        priority: 'Medium',
        start: taskDateTime,
        durationMin: 60
      });
    }
  };

  const handleTaskClick = useCallback((task: Task) => {
    onTaskClick?.(task);
  }, [onTaskClick]);

  const weekRange = `${format(weekDays[0].date, 'MMM d')} - ${format(weekDays[6].date, 'MMM d, yyyy')}`;

  return (
    <div className="card-elevated animate-scale-in overflow-hidden">
      {/* Week Header */}
      <div className="p-6 pb-4 border-b border-outline-variant/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-large font-medium text-on-surface">{weekRange}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTodayClick}
              className="btn-outlined px-4 py-2 text-label-medium"
            >
              Today
            </button>
            <button
              onClick={handlePreviousWeek}
              className="w-10 h-10 rounded-full surface-container-high hover:bg-primary-40/10 
                flex items-center justify-center transition-colors duration-200"
              aria-label="Previous week"
            >
              <span className="text-lg">‹</span>
            </button>
            <button
              onClick={handleNextWeek}
              className="w-10 h-10 rounded-full surface-container-high hover:bg-primary-40/10 
                flex items-center justify-center transition-colors duration-200"
              aria-label="Next week"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-8 gap-0">
          <div className="p-3 text-center">
            <span className="text-label-small text-on-surface-variant">Time</span>
          </div>
          {weekDays.map((day) => (
            <div key={day.date.toISOString()} className="p-3 text-center">
              <div className={`text-label-medium font-medium ${
                day.isToday ? 'text-primary-40' : 'text-on-surface'
              }`}>
                {day.dayName}
              </div>
              <div className={`text-body-small mt-1 w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                day.isToday 
                  ? 'bg-primary-40 text-on-primary' 
                  : 'text-on-surface-variant'
              }`}>
                {day.dayNumber}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Week Grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div className="grid grid-cols-8 gap-0">
          {/* Time Column */}
          <div className="border-r border-outline-variant/10">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 p-2 border-b border-outline-variant/5 text-right">
                <span className="text-label-small text-on-surface-variant">
                  {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => (
            <div key={day.date.toISOString()} className="border-r border-outline-variant/10">
              {HOURS.map((hour) => {
                const hourTasks = getTasksForHour(day.tasks, hour);
                const isCurrentHour = day.isToday && new Date().getHours() === hour;
                
                return (
                  <div
                    key={hour}
                    onClick={() => handleTimeSlotClick(day.date, hour)}
                    className={`h-16 p-1 border-b border-outline-variant/5 cursor-pointer
                      hover:bg-primary-40/5 transition-colors duration-200 relative ${
                        isCurrentHour ? 'bg-primary-40/10' : ''
                      }`}
                  >
                    {/* Time Slot Tasks */}
                    {hourTasks.map((task) => (
                      <TaskBlock
                        key={task.id}
                        task={task}
                        onClick={handleTaskClick}
                      />
                    ))}
                    
                    {/* Current Time Indicator */}
                    {isCurrentHour && (
                      <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2">
                        <div className="h-0.5 bg-error-40 relative">
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-error-40 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}