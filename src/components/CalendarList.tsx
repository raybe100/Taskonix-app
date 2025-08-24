import { Task } from '../types';
import { groupTasksByDay } from '../lib/schedule';
import { format, parseISO } from 'date-fns';

interface CalendarListProps {
  tasks: Task[];
  onSuggestTime: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function CalendarList({ tasks, onSuggestTime, onDeleteTask }: CalendarListProps) {
  const groupedTasks = groupTasksByDay(tasks);
  
  return (
    <div className="space-y-8">
      <h2 className="text-headline-large text-on-surface">Your Tasks</h2>
      
      {/* Today */}
      <TaskGroup
        title="Today"
        tasks={groupedTasks.today}
        onSuggestTime={onSuggestTime}
        onDeleteTask={onDeleteTask}
        titleColor="text-primary-40"
        emptyIcon="📅"
      />
      
      {/* Tomorrow */}
      <TaskGroup
        title="Tomorrow"
        tasks={groupedTasks.tomorrow}
        onSuggestTime={onSuggestTime}
        onDeleteTask={onDeleteTask}
        titleColor="text-secondary-40"
        emptyIcon="⏰"
      />
      
      {/* Later */}
      <TaskGroup
        title="Later"
        tasks={groupedTasks.later}
        onSuggestTime={onSuggestTime}
        onDeleteTask={onDeleteTask}
        titleColor="text-tertiary-40"
        emptyIcon="🗓️"
      />
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onSuggestTime: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  titleColor: string;
  emptyIcon: string;
}

function TaskGroup({ title, tasks, onSuggestTime, onDeleteTask, titleColor, emptyIcon }: TaskGroupProps) {
  if (tasks.length === 0) {
    return (
      <div className="animate-fade-in">
        <h3 className={`text-title-large font-medium ${titleColor} mb-4 flex items-center gap-2`}>
          <span className="text-2xl">{emptyIcon}</span>
          {title}
        </h3>
        <div className="surface-container p-6 rounded-xl text-center">
          <p className="text-body-medium text-on-surface-variant">No tasks scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <h3 className={`text-title-large font-medium ${titleColor} mb-4 flex items-center gap-2`}>
        <span className="text-2xl">{emptyIcon}</span>
        {title}
        <span className="chip text-label-small ml-2 bg-surface-light-container dark:bg-accent-dark-teal/20 dark:text-accent-dark-teal dark:border-accent-dark-teal/30">{tasks.length}</span>
      </h3>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskCard 
            key={task.id}
            task={task}
            onSuggestTime={onSuggestTime}
            onDeleteTask={onDeleteTask}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onSuggestTime: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  index: number;
}

function TaskCard({ task, onSuggestTime, onDeleteTask, index }: TaskCardProps) {
  const priorityConfig = {
    High: {
      color: 'border-l-priority-high bg-priority-high/5',
      chipColor: 'bg-priority-high text-white',
      icon: '🔴'
    },
    Medium: {
      color: 'border-l-priority-medium bg-priority-medium/5',
      chipColor: 'bg-priority-medium text-white',
      icon: '🟡'
    },
    Low: {
      color: 'border-l-priority-low bg-priority-low/5',
      chipColor: 'bg-priority-low text-white',
      icon: '🟢'
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const canSuggestTime = task.priority !== 'High' && !task.start;
  const config = priorityConfig[task.priority];

  return (
    <div 
      className={`card-elevated border-l-4 p-5 animate-fade-in state-layer ${config.color}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-lg mt-1 flex-shrink-0">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-title-medium text-on-surface mb-2 line-clamp-2">
                {task.title}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`chip-elevated text-label-small ${config.chipColor}`}>
                  {task.priority}
                </span>
                {task.durationMin && (
                  <span className="chip text-label-small bg-surface-light-container dark:bg-accent-dark-gold/20 dark:text-accent-dark-gold dark:border-accent-dark-gold/30">
                    {task.durationMin}m
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {task.start ? (
              <div className="flex items-center gap-2 text-body-medium text-on-surface-variant">
                <span>⏰</span>
                <span>{formatTime(task.start)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-body-small text-on-surface-variant">Not scheduled</span>
                {canSuggestTime && (
                  <button
                    onClick={() => onSuggestTime(task.id)}
                    className="btn-text text-label-small py-1 px-3 rounded-full"
                  >
                    Suggest time
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onDeleteTask(task.id)}
          className="text-on-surface-variant hover:text-error-40 p-2 rounded-full transition-colors state-layer flex-shrink-0"
          title="Delete task"
        >
          <span className="text-lg">🗑️</span>
        </button>
      </div>
    </div>
  );
}