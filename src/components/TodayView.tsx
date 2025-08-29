import { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Item } from '../types';
import { useItemsStore } from '../store/useItemsStore';

interface TodayViewProps {
  className?: string;
}

interface ItemCardProps {
  item: Item;
  onComplete: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

function ItemCard({ item, onComplete, onEdit, onDelete }: ItemCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(item.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await onDelete(item.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };


  const getTimeDisplay = () => {
    if (item.type === 'event' && item.start_at) {
      const startTime = new Date(item.start_at);
      const endTime = item.end_at ? new Date(item.end_at) : null;
      
      if (item.all_day) {
        return 'All day';
      }
      
      if (endTime) {
        return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
      } else {
        return format(startTime, 'h:mm a');
      }
    }
    
    if (item.due_at) {
      return `Due: ${format(new Date(item.due_at), 'h:mm a')}`;
    }
    
    return null;
  };

  const isOverdue = () => {
    if (item.status === 'done' || item.status === 'cancelled') return false;
    
    const now = new Date();
    if (item.due_at && new Date(item.due_at) < now) return true;
    if (item.start_at && item.type === 'event' && new Date(item.start_at) < now) return true;
    
    return false;
  };

  return (
    <div
      className={`group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer overflow-hidden ${
        isOverdue() ? 'ring-2 ring-red-300 dark:ring-red-600' : ''
      }`}
      onClick={() => onEdit(item)}
    >
      {/* Priority indicator stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        item.priority >= 5 ? 'bg-red-500' :
        item.priority >= 4 ? 'bg-orange-500' :
        item.priority >= 3 ? 'bg-blue-500' :
        item.priority >= 2 ? 'bg-green-500' :
        'bg-gray-400'
      }`} />

      <div className="flex items-center gap-3 p-3">
        {/* Icon and type indicator */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          item.type === 'event' 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {item.type === 'event' ? '📅' : '📝'}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm leading-tight">
              {item.title}
            </h3>
            
            {/* Badges */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.priority >= 4 && (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                  !
                </span>
              )}
              {isOverdue() && (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500 text-white text-xs font-medium rounded animate-pulse">
                  Late
                </span>
              )}
            </div>
          </div>

          {/* Details row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {/* Time */}
            {getTimeDisplay() && (
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 flex items-center justify-center">🕐</span>
                <span className="font-medium">{getTimeDisplay()}</span>
              </div>
            )}

            {/* Location */}
            {item.location_name && (
              <div className="flex items-center gap-1 truncate">
                <span className="w-3 h-3 flex items-center justify-center">📍</span>
                <span className="truncate max-w-24">{item.location_name}</span>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 flex items-center justify-center">#</span>
                <span className="truncate">
                  {item.tags.slice(0, 2).join(', ')}
                  {item.tags.length > 2 && ` +${item.tags.length - 2}`}
                </span>
              </div>
            )}
          </div>

          {/* Notes - only show if present and not too long */}
          {item.notes && item.notes.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-1 max-w-md">
              {item.notes}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 disabled:opacity-50 hover:scale-105"
            title="Delete task"
          >
            {isDeleting ? (
              <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xs">🗑️</span>
            )}
          </button>

          {/* Complete button */}
          {item.status !== 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              disabled={isCompleting}
              className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400 flex items-center justify-center transition-all duration-200 disabled:opacity-50 hover:scale-105"
              title="Mark as complete"
            >
              {isCompleting ? (
                <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs">✓</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Subtle hover indicator */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50/50 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}

export function TodayView({ className = '' }: TodayViewProps) {
  const {
    items,
    loading,
    error,
    completeItem,
    deleteItem
  } = useItemsStore();

  // Organize today's items
  const todayData = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Filter items for today
    const todayItems = items.filter(item => {
      if (item.status === 'done' || item.status === 'cancelled') return false;
      
      // Due today
      if (item.due_at) {
        const dueDate = new Date(item.due_at);
        return dueDate >= todayStart && dueDate <= todayEnd;
      }
      
      // Scheduled today
      if (item.start_at) {
        const startDate = new Date(item.start_at);
        return startDate >= todayStart && startDate <= todayEnd;
      }
      
      // Tasks without dates (pending)
      return item.type === 'task' && !item.start_at && !item.due_at;
    });

    // Get overdue items
    const overdueItems = items.filter(item => {
      if (item.status === 'done' || item.status === 'cancelled') return false;
      
      const now = new Date();
      
      if (item.due_at && new Date(item.due_at) < todayStart) return true;
      if (item.start_at && item.type === 'event' && new Date(item.start_at) < now) return true;
      
      return false;
    });

    // Separate events and tasks for today
    const todayEvents = todayItems
      .filter(item => item.type === 'event' && item.start_at)
      .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime());

    const todayTasks = todayItems
      .filter(item => item.type === 'task')
      .sort((a, b) => {
        // Sort by due time, then priority
        if (a.due_at && b.due_at) {
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        }
        if (a.due_at && !b.due_at) return -1;
        if (!a.due_at && b.due_at) return 1;
        return b.priority - a.priority;
      });

    const noDateTasks = todayItems
      .filter(item => item.type === 'task' && !item.start_at && !item.due_at)
      .sort((a, b) => b.priority - a.priority);

    return {
      overdue: overdueItems.sort((a, b) => b.priority - a.priority),
      events: todayEvents,
      tasks: todayTasks,
      noDateTasks,
      total: todayItems.length + overdueItems.length
    };
  }, [items]);

  const handleEditItem = (item: Item) => {
    // TODO: Open edit modal/sheet
    console.log('Edit item:', item);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-40 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading today's items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Unable to Load Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        
        {/* Helpful troubleshooting actions */}
        <div className="space-y-3 max-w-sm mx-auto">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
          
          {error.includes('permission denied') && (
            <div className="text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Database Permission Issue:</strong><br/>
                This usually means the database schema needs to be updated. 
                Please check the browser console for detailed error information.
              </p>
            </div>
          )}
          
          {error.includes('User not authenticated') && (
            <div className="text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Authentication Issue:</strong><br/>
                Please sign out and sign back in to refresh your authentication.
              </p>
            </div>
          )}
          
          <details className="text-left">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {error}
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Today
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {format(new Date(), 'EEEE, MMMM do')}
        </p>
        {todayData.total > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {todayData.total} {todayData.total === 1 ? 'item' : 'items'} on your agenda
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-2xl font-bold text-red-500 mb-1">{todayData.overdue.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Overdue</div>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-500 mb-1">{todayData.events.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Events</div>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-2xl font-bold text-green-500 mb-1">{todayData.tasks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Tasks</div>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-500 mb-1">{todayData.noDateTasks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">No Date</div>
        </div>
      </div>

      {/* Overdue Items */}
      {todayData.overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <span className="text-sm">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Overdue
            </h2>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
              {todayData.overdue.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayData.overdue.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onComplete={completeItem}
                onEdit={handleEditItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Events */}
      {todayData.events.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-sm">📅</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Events
            </h2>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
              {todayData.events.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayData.events.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onComplete={completeItem}
                onEdit={handleEditItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      {todayData.tasks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-sm">✅</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks
            </h2>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
              {todayData.tasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayData.tasks.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onComplete={completeItem}
                onEdit={handleEditItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tasks without dates */}
      {todayData.noDateTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-sm">📝</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              To Schedule
            </h2>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
              {todayData.noDateTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayData.noDateTasks.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onComplete={completeItem}
                onEdit={handleEditItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {todayData.total === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            All Clear!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You have no tasks or events scheduled for today.
          </p>
          <button
            onClick={() => window.location.href = '/capture'}
            className="px-6 py-3 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 transition-colors"
          >
            Add Something New
          </button>
        </div>
      )}
    </div>
  );
}