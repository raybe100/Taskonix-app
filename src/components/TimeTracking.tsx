import { useState, useEffect } from 'react';
import { Task } from '../types';
import { timeTracker, formatDuration, formatTimeRange } from '../lib/timeTracking';

interface TimeTrackingProps {
  tasks: Task[];
}

export function TimeTracking({ tasks }: TimeTrackingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeEntry, setActiveEntry] = useState(timeTracker.getActiveEntry());
  const [elapsedTime, setElapsedTime] = useState(timeTracker.getElapsedTime());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEntry(timeTracker.getActiveEntry());
      setElapsedTime(timeTracker.getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartTracking = (task: Task) => {
    timeTracker.startTracking(task);
    setActiveEntry(timeTracker.getActiveEntry());
    setSelectedTask(null);
  };

  const handleStopTracking = () => {
    timeTracker.stopTracking();
    setActiveEntry(null);
    setElapsedTime(0);
  };

  const recentEntries = timeTracker.getAllEntries().slice(-5);
  const stats = timeTracker.getTimeStats();

  return (
    <div className="card-elevated p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-large font-medium text-on-surface flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          Time Tracking
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-outlined-small"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Active Timer Display */}
      {activeEntry && (
        <div className="mb-4 p-4 bg-primary-40/10 border border-primary-40/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-title-medium font-medium text-primary-40 mb-1">
                {activeEntry.taskTitle}
              </h4>
              <p className="text-body-medium text-on-surface-variant">
                Started: {new Date(activeEntry.startTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-display-small font-normal text-primary-40 mb-1">
                {formatDuration(elapsedTime)}
              </div>
              <button
                onClick={handleStopTracking}
                className="btn-filled-small bg-error-40 text-white"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Buttons */}
      {!activeEntry && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-body-medium text-on-surface-variant">Quick Start Timer:</p>
            {selectedTask && (
              <button
                onClick={() => setSelectedTask(null)}
                className="text-body-small text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
            )}
          </div>
          
          {!selectedTask ? (
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {tasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="text-left p-3 surface-container rounded-lg hover:bg-primary-40/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium text-on-surface truncate">{task.title}</span>
                    <div className={`w-2 h-2 rounded-full ${{
                      High: 'bg-error-40',
                      Medium: 'bg-tertiary-40', 
                      Low: 'bg-primary-40'
                    }[task.priority]}`} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 surface-container rounded-xl border border-primary-40/20">
              <h4 className="text-title-medium font-medium text-on-surface mb-2">
                {selectedTask.title}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartTracking(selectedTask)}
                  className="btn-filled flex-1"
                >
                  Start Timer
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="btn-outlined-small px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4 border-t border-outline-variant/20 pt-4">
          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center surface-container p-3 rounded-lg">
              <div className="text-title-large font-medium text-primary-40">
                {formatDuration(stats.totalTime)}
              </div>
              <div className="text-body-small text-on-surface-variant">Today</div>
            </div>
            <div className="text-center surface-container p-3 rounded-lg">
              <div className="text-title-large font-medium text-secondary-40">
                {stats.tasksCompleted}
              </div>
              <div className="text-body-small text-on-surface-variant">Tasks</div>
            </div>
            <div className="text-center surface-container p-3 rounded-lg">
              <div className="text-title-large font-medium text-tertiary-40">
                {Math.round(stats.averageTaskTime)}m
              </div>
              <div className="text-body-small text-on-surface-variant">Avg</div>
            </div>
          </div>

          {/* Recent Entries */}
          <div>
            <h4 className="text-title-medium font-medium text-on-surface mb-3">Recent Sessions</h4>
            {recentEntries.length > 0 ? (
              <div className="space-y-2">
                {recentEntries.reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 surface-container rounded-lg">
                    <div>
                      <div className="text-body-medium text-on-surface font-medium">
                        {entry.taskTitle}
                      </div>
                      <div className="text-body-small text-on-surface-variant">
                        {formatTimeRange(entry.startTime, entry.endTime)}
                      </div>
                    </div>
                    <div className="text-body-medium text-primary-40 font-medium">
                      {entry.duration ? formatDuration(entry.duration) : 'Active'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-on-surface-variant">
                <span className="text-3xl mb-2 block">📊</span>
                <p className="text-body-medium">No time entries yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}