import { useState, useMemo } from 'react';
import { Task } from '../types';
import { timeTracker, formatDuration } from '../lib/timeTracking';

interface ProductivityAnalyticsProps {
  tasks: Task[];
}

export function ProductivityAnalytics({ tasks }: ProductivityAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const analytics = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    const stats = timeTracker.getTimeStats(startDate, now);
    
    // Task completion rate
    const completedTasks = tasks.filter(task => {
      const entries = timeTracker.getEntriesForTask(task.id);
      return entries.length > 0 && entries.some(entry => entry.duration && entry.duration > 0);
    }).length;
    
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    // Priority distribution
    const priorityStats = {
      High: tasks.filter(t => t.priority === 'High').length,
      Medium: tasks.filter(t => t.priority === 'Medium').length,
      Low: tasks.filter(t => t.priority === 'Low').length
    };
    
    // Scheduled vs unscheduled
    const scheduledTasks = tasks.filter(t => t.start).length;
    const unscheduledTasks = tasks.length - scheduledTasks;
    
    // Most productive category
    const topCategory = Object.entries(stats.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      ...stats,
      completionRate,
      priorityStats,
      scheduledTasks,
      unscheduledTasks,
      topCategory: topCategory ? { name: topCategory[0], time: topCategory[1] } : null
    };
  }, [tasks, timeRange]);

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-primary-40';
    if (score >= 60) return 'text-tertiary-40';
    if (score >= 40) return 'text-secondary-40';
    return 'text-error-40';
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-primary-40';
    if (rate >= 60) return 'bg-tertiary-40';
    if (rate >= 40) return 'bg-secondary-40';
    return 'bg-error-40';
  };

  return (
    <div className="card-elevated p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-large font-medium text-on-surface flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Productivity Analytics
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-outlined-small"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Productivity Score - Always Visible */}
      <div className="text-center mb-4 p-4 surface-container rounded-xl">
        <div className={`text-display-medium font-normal mb-2 ${getProductivityColor(analytics.productivityScore)}`}>
          {analytics.productivityScore}%
        </div>
        <div className="text-body-medium text-on-surface-variant">
          Productivity Score ({timeRange})
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 border-t border-outline-variant/20 pt-4">
          {/* Time Range Selector */}
          <div className="flex justify-center">
            <div className="surface-container rounded-lg p-1 flex">
              {(['today', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-label-medium font-medium transition-all duration-200 capitalize ${
                    timeRange === range 
                      ? 'bg-primary-40 text-on-primary shadow-elevation-1' 
                      : 'text-on-surface-variant hover:bg-on-surface/8'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="surface-container p-4 rounded-xl">
              <div className="text-title-large font-medium text-primary-40 mb-1">
                {formatDuration(analytics.totalTime)}
              </div>
              <div className="text-body-small text-on-surface-variant">Time Tracked</div>
            </div>

            <div className="surface-container p-4 rounded-xl">
              <div className="text-title-large font-medium text-secondary-40 mb-1">
                {analytics.tasksCompleted}
              </div>
              <div className="text-body-small text-on-surface-variant">Tasks Completed</div>
            </div>

            <div className="surface-container p-4 rounded-xl">
              <div className="text-title-large font-medium text-tertiary-40 mb-1">
                {Math.round(analytics.completionRate)}%
              </div>
              <div className="text-body-small text-on-surface-variant">Completion Rate</div>
            </div>

            <div className="surface-container p-4 rounded-xl">
              <div className="text-title-large font-medium text-error-40 mb-1">
                {Math.round(analytics.averageTaskTime)}m
              </div>
              <div className="text-body-small text-on-surface-variant">Avg Task Time</div>
            </div>
          </div>

          {/* Completion Progress Bar */}
          <div className="surface-container p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-medium text-on-surface">Task Completion</span>
              <span className="text-body-small text-on-surface-variant">
                {Math.round(analytics.completionRate)}%
              </span>
            </div>
            <div className="w-full bg-outline-variant/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getCompletionColor(analytics.completionRate)}`}
                style={{ width: `${Math.min(analytics.completionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="surface-container p-4 rounded-xl">
            <h4 className="text-title-medium font-medium text-on-surface mb-3">
              Task Priorities
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error-40" />
                  <span className="text-body-medium text-on-surface">High Priority</span>
                </div>
                <span className="text-body-medium text-on-surface-variant">
                  {analytics.priorityStats.High}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-tertiary-40" />
                  <span className="text-body-medium text-on-surface">Medium Priority</span>
                </div>
                <span className="text-body-medium text-on-surface-variant">
                  {analytics.priorityStats.Medium}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-40" />
                  <span className="text-body-medium text-on-surface">Low Priority</span>
                </div>
                <span className="text-body-medium text-on-surface-variant">
                  {analytics.priorityStats.Low}
                </span>
              </div>
            </div>
          </div>

          {/* Top Category */}
          {analytics.topCategory && (
            <div className="surface-container p-4 rounded-xl">
              <h4 className="text-title-medium font-medium text-on-surface mb-2">
                Most Productive Category
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-body-large text-primary-40 font-medium">
                  {analytics.topCategory.name}
                </span>
                <span className="text-body-medium text-on-surface-variant">
                  {formatDuration(analytics.topCategory.time)}
                </span>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="surface-container p-4 rounded-xl">
            <h4 className="text-title-medium font-medium text-on-surface mb-3">
              💡 Insights
            </h4>
            <div className="space-y-2 text-body-small text-on-surface-variant">
              {analytics.scheduledTasks > analytics.unscheduledTasks && (
                <p>✅ Great job scheduling your tasks! Scheduled tasks have higher completion rates.</p>
              )}
              {analytics.completionRate > 80 && (
                <p>🎉 Excellent completion rate! You're staying on top of your tasks.</p>
              )}
              {analytics.averageTaskTime > 60 && (
                <p>⏰ Consider breaking down longer tasks into smaller, manageable chunks.</p>
              )}
              {analytics.priorityStats.High > analytics.priorityStats.Low && (
                <p>🔥 You have many high-priority tasks. Focus on completing these first.</p>
              )}
              {analytics.totalTime === 0 && (
                <p>📊 Start tracking time to get detailed productivity insights!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}