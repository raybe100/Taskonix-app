import { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks,
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  startOfDay,
  endOfDay
} from 'date-fns';
import { Item, PRIORITY_LABELS } from '../types';
import { useItemsStore } from '../store/useItemsStore';

interface CalendarViewProps {
  className?: string;
}

interface CalendarCellProps {
  date: Date;
  currentMonth: Date;
  items: Item[];
  isSelected: boolean;
  onDateClick: (date: Date) => void;
}

interface AgendaItemProps {
  item: Item;
  onComplete: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

function CalendarCell({ date, currentMonth, items, isSelected, onDateClick }: CalendarCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  
  // Filter items for this date
  const dayItems = items.filter(item => {
    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);
    
    if (item.start_at) {
      const itemStart = new Date(item.start_at);
      return itemStart >= dateStart && itemStart <= dateEnd;
    }
    
    if (item.due_at) {
      const itemDue = new Date(item.due_at);
      return itemDue >= dateStart && itemDue <= dateEnd;
    }
    
    return false;
  });

  const hasHighPriorityItems = dayItems.some(item => item.priority >= 4);
  const hasOverdueItems = dayItems.some(item => {
    if (item.status === 'done' || item.status === 'cancelled') return false;
    const now = new Date();
    if (item.due_at && new Date(item.due_at) < now) return true;
    if (item.start_at && item.type === 'event' && new Date(item.start_at) < now) return true;
    return false;
  });

  return (
    <button
      onClick={() => onDateClick(date)}
      className={`
        relative w-full aspect-square p-1 sm:p-2 border border-gray-200 dark:border-gray-700 
        hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
        ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-800/50' : ''}
        ${isTodayDate ? 'bg-blue-100 dark:bg-blue-900/30 font-semibold' : ''}
        ${isSelected ? 'ring-2 ring-primary-40 bg-primary-40/10' : ''}
      `}
    >
      {/* Date number */}
      <div className="text-center">
        <span className={`
          text-sm sm:text-base
          ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
        `}>
          {format(date, 'd')}
        </span>
      </div>

      {/* Item indicators */}
      {dayItems.length > 0 && (
        <div className="absolute bottom-1 left-1 right-1">
          <div className="flex items-center justify-center gap-0.5">
            {dayItems.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className={`
                  w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full
                  ${item.priority >= 4 ? 'bg-red-500' : 
                    item.priority >= 3 ? 'bg-yellow-500' : 'bg-green-500'}
                `}
                title={item.title}
              />
            ))}
            {dayItems.length > 3 && (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
            )}
          </div>
          
          {/* Show count for many items */}
          {dayItems.length > 4 && (
            <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-0.5">
              {dayItems.length}
            </div>
          )}
        </div>
      )}

      {/* Priority/overdue indicators */}
      {hasOverdueItems && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      {hasHighPriorityItems && !hasOverdueItems && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
      )}
    </button>
  );
}

function AgendaItem({ item, onComplete, onEdit, onDelete }: AgendaItemProps) {
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

  const getPriorityColor = () => {
    switch (item.priority) {
      case 5: return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 4: return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 3: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 2: return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 1: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default: return 'border-gray-300 bg-white dark:bg-gray-800';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border-l-4 hover:shadow-md transition-all cursor-pointer ${getPriorityColor()}`}
      onClick={() => onEdit(item)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">
              {item.type === 'event' ? '📅' : '✓'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {item.title}
            </span>
            {item.priority >= 4 && (
              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded">
                {PRIORITY_LABELS[item.priority]}
              </span>
            )}
          </div>
          
          {getTimeDisplay() && (
            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <span>🕒</span>
              {getTimeDisplay()}
            </div>
          )}
          
          {item.location_name && (
            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-1">
              <span>📍</span>
              <span className="truncate">{item.location_name}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
            title="Delete task"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-red-600 dark:text-red-400 text-sm">🗑️</span>
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
              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
              title="Mark as complete"
            >
              {isCompleting ? (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-green-600 dark:text-green-400">✓</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ className = '' }: CalendarViewProps) {
  const {
    items,
    loading,
    error,
    completeItem,
    deleteItem
  } = useItemsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [navigationMode, setNavigationMode] = useState<'day' | 'week' | 'month'>('month');

  // Generate calendar days for different views
  const viewData = useMemo(() => {
    if (navigationMode === 'day') {
      // Single day view
      return {
        type: 'day',
        days: [currentDate],
        title: format(currentDate, 'EEEE, MMMM d, yyyy')
      };
    } else if (navigationMode === 'week') {
      // Week view
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      const days = [];
      let day = weekStart;
      
      while (day <= weekEnd) {
        days.push(day);
        day = addDays(day, 1);
      }
      
      return {
        type: 'week',
        days,
        title: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      };
    } else {
      // Month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);

      const days = [];
      let day = calendarStart;
      
      while (day <= calendarEnd) {
        days.push(day);
        day = addDays(day, 1);
      }
      
      return {
        type: 'month',
        days,
        title: format(currentDate, 'MMMM yyyy')
      };
    }
  }, [currentDate, navigationMode]);

  // Get items for selected date (or current date in day mode)
  const selectedDateItems = useMemo(() => {
    const targetDate = navigationMode === 'day' ? currentDate : selectedDate;
    const dateStart = startOfDay(targetDate);
    const dateEnd = endOfDay(targetDate);
    
    return items
      .filter(item => {
        if (item.status === 'done' || item.status === 'cancelled') return false;
        
        if (item.start_at) {
          const itemStart = new Date(item.start_at);
          return itemStart >= dateStart && itemStart <= dateEnd;
        }
        
        if (item.due_at) {
          const itemDue = new Date(item.due_at);
          return itemDue >= dateStart && itemDue <= dateEnd;
        }
        
        return false;
      })
      .sort((a, b) => {
        // Sort by time, then priority
        const aTime = a.start_at || a.due_at;
        const bTime = b.start_at || b.due_at;
        
        if (aTime && bTime) {
          return new Date(aTime).getTime() - new Date(bTime).getTime();
        }
        
        return b.priority - a.priority;
      });
  }, [items, selectedDate, currentDate, navigationMode]);

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (navigationMode) {
        case 'day':
          return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1);
        case 'week':
          return direction === 'prev' ? addWeeks(prev, -1) : addWeeks(prev, 1);
        case 'month':
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
        default:
          return prev;
      }
    });
    
    // Auto-select the new date when navigating by day
    if (navigationMode === 'day') {
      setSelectedDate(prev => 
        direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1)
      );
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getNavigationLabel = () => {
    switch (navigationMode) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEditItem = (item: Item) => {
    // TODO: Open edit modal/sheet
    console.log('Edit item:', item);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigate('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigate('next');
          break;
        case 't':
        case 'T':
          goToToday();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, goToToday]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-40 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading calendar...</p>
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
          Error Loading Calendar
        </h3>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Calendar
            </h1>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>

          {/* Today Button */}
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 transition-colors text-sm font-medium"
          >
            Today
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          {/* Navigation Mode Selector */}
          <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setNavigationMode('day')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                navigationMode === 'day'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              📅 Day
            </button>
            <button
              onClick={() => setNavigationMode('week')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                navigationMode === 'week'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              📊 Week
            </button>
            <button
              onClick={() => setNavigationMode('month')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                navigationMode === 'month'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              🗓️ Month
            </button>
          </div>

          {/* Date Display and Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
              title={`Previous ${navigationMode}`}
            >
              <span className="text-xl">←</span>
            </button>
            
            <div className="text-center min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {getNavigationLabel()}
              </h2>
            </div>
            
            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
              title={`Next ${navigationMode}`}
            >
              <span className="text-xl">→</span>
            </button>
          </div>

          {/* Quick Navigation Hints */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded text-xs">←</kbd>
              <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded text-xs">→</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded text-xs">T</kbd>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render different view layouts based on navigation mode */}
      {viewMode === 'month' ? (
        <>
          {/* Day View */}
          {navigationMode === 'day' && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {format(currentDate, 'EEEE')}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                      {format(currentDate, 'MMMM d, yyyy')}
                    </p>
                    {isToday(currentDate) && (
                      <span className="mt-2 inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-6">
                  {selectedDateItems.length > 0 ? (
                    <div className="space-y-4">
                      {/* Time slots view */}
                      <div className="grid gap-2">
                        {selectedDateItems.map(item => (
                          <div
                            key={item.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <AgendaItem
                              item={item}
                              onComplete={completeItem}
                              onEdit={handleEditItem}
                              onDelete={deleteItem}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-4xl">📅</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Free Day!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        No tasks or events scheduled for this day
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Week View */}
          {navigationMode === 'week' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-0">
                  {/* Weekday Headers */}
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <div key={day} className="bg-gray-50 dark:bg-gray-700 p-4 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          {day}
                        </p>
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-300 mt-1">
                          {format(viewData.days[index], 'd')}
                        </p>
                        {isToday(viewData.days[index]) && (
                          <span className="mt-1 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week Content */}
                <div className="grid grid-cols-7 gap-0 min-h-96">
                  {viewData.days.map(day => {
                    const dayItems = items.filter(item => {
                      const dateStart = startOfDay(day);
                      const dateEnd = endOfDay(day);
                      
                      if (item.start_at) {
                        const itemStart = new Date(item.start_at);
                        return itemStart >= dateStart && itemStart <= dateEnd;
                      }
                      
                      if (item.due_at) {
                        const itemDue = new Date(item.due_at);
                        return itemDue >= dateStart && itemDue <= dateEnd;
                      }
                      
                      return false;
                    });

                    return (
                      <div
                        key={day.toISOString()}
                        className="border-r border-gray-200 dark:border-gray-600 last:border-r-0 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        onClick={() => {
                          setSelectedDate(day);
                          setNavigationMode('day');
                          setCurrentDate(day);
                        }}
                      >
                        <div className="space-y-1">
                          {dayItems.slice(0, 3).map(item => (
                            <div
                              key={item.id}
                              className={`p-1 text-xs rounded truncate ${
                                item.priority >= 4 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                                item.priority >= 3 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                          ))}
                          {dayItems.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              +{dayItems.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Month View */}
          {navigationMode === 'month' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 sm:p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7">
                    {viewData.days.map(day => (
                      <CalendarCell
                        key={day.toISOString()}
                        date={day}
                        currentMonth={currentDate}
                        items={items}
                        isSelected={isSameDay(day, selectedDate)}
                        onDateClick={handleDateClick}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Date Agenda */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {format(selectedDate, 'EEEE, MMM d')}
                    {isToday(selectedDate) && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        Today
                      </span>
                    )}
                  </h3>

                  {selectedDateItems.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedDateItems.map(item => (
                        <AgendaItem
                          key={item.id}
                          item={item}
                          onComplete={completeItem}
                          onEdit={handleEditItem}
                          onDelete={deleteItem}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        No items scheduled for this day
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Agenda View */
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Items
            </h3>
            
            {/* Group items by date */}
            <p className="text-gray-600 dark:text-gray-300">
              Agenda view coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}