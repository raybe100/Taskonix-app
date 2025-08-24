import { useState, useEffect } from 'react';
import { TaskForm } from './components/TaskForm';
import { CalendarList } from './components/CalendarList';
import { Calendar } from './components/Calendar';
import { CalendarWeekView } from './components/CalendarWeekView';
import { ExportImport } from './components/ExportImport';
import { AdvancedVoiceInterface } from './components/AdvancedVoiceInterface';
import { TaskTemplates } from './components/TaskTemplates';
import { TimeTracking } from './components/TimeTracking';
import { ProductivityAnalytics } from './components/ProductivityAnalytics';
import { SmartVoiceAssistant } from './components/SmartVoiceAssistant';
import { PricingModal } from './components/PricingModal';
import { PaymentForm } from './components/PaymentForm';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { UserButton } from './components/UserButton';
import { ProtectedContent } from './components/ProtectedContent';
import { useHybridTasks } from './hooks/useHybridTasks';
import { useCalendar } from './hooks/useCalendar';
import { useDarkMode } from './hooks/useDarkMode';
import { useSubscription } from './hooks/useSubscription';
import { useUser } from '@clerk/clerk-react';
import { Task, TaskFormData } from './types';
import { PricingPlan } from './lib/stripe';
import { 
  requestNotificationPermission, 
  scheduleTaskNotifications, 
  areNotificationsEnabled,
  getNotificationPermission 
} from './lib/notifications';

function App() {
  const { isSignedIn, user } = useUser();
  const { 
    tasks, 
    loading, 
    error,
    addTask, 
    deleteTask, 
    updateTask,
    suggestTimeSlot,
    importTasks,
    backend 
  } = useHybridTasks();
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    return (localStorage.getItem('todo-calendar-view-mode') as 'list' | 'calendar') || 'list';
  });
  const [calendarView, setCalendarView] = useState<'month' | 'week'>(() => {
    return (localStorage.getItem('todo-calendar-calendar-view') as 'month' | 'week') || 'month';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => areNotificationsEnabled());
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { subscription, upgradeToPlan, isWithinLimits } = useSubscription();
  
  // Payment modal states
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const calendar = useCalendar({
    tasks,
    onTaskUpdate: updateTask,
    onTaskCreate: addTask
  });

  const handleSuggestTime = (taskId: string) => {
    const success = suggestTimeSlot(taskId);
    if (!success) {
      // Could not find an available time slot - could show a toast notification here
      // For now, the user can see this from the UI feedback
    }
  };
  
  const handleTaskClick = (task: Task) => {
    calendar.handleTaskClick(task);
  };

  const handleViewModeChange = (mode: 'list' | 'calendar') => {
    setViewMode(mode);
    localStorage.setItem('todo-calendar-view-mode', mode);
  };

  const handleCalendarViewChange = (view: 'month' | 'week') => {
    setCalendarView(view);
    localStorage.setItem('todo-calendar-calendar-view', view);
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        scheduleTaskNotifications(tasks);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  // Schedule notifications when tasks change
  useEffect(() => {
    if (notificationsEnabled) {
      scheduleTaskNotifications(tasks);
    }
  }, [tasks, notificationsEnabled]);

  const handleApplyTemplate = (templateTasks: TaskFormData[]) => {
    // Check if adding these tasks would exceed the limit
    const wouldExceedLimit = !isWithinLimits(tasks.length + templateTasks.length, 'maxTasks');
    
    if (wouldExceedLimit) {
      setIsPricingModalOpen(true);
      return;
    }
    
    templateTasks.forEach(taskData => addTask(taskData));
  };

  const handleAddTask = (taskData: TaskFormData) => {
    // Check task limit before adding
    if (!isWithinLimits(tasks.length + 1, 'maxTasks')) {
      setIsPricingModalOpen(true);
      return;
    }
    
    addTask(taskData);
  };

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      setIsPricingModalOpen(false);
      return;
    }
    
    setSelectedPlan(plan);
    setIsPricingModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (selectedPlan) {
      const success = await upgradeToPlan(selectedPlan.id);
      if (success) {
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
        // Show success message or redirect
      }
    }
  };

  const handlePaymentCancel = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center card-elevated p-8 animate-scale-in">
          <div className="w-12 h-12 border-4 border-primary-40 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body-large text-on-surface-variant">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center card-elevated p-8 animate-scale-in">
          <div className="w-12 h-12 rounded-full bg-error-40/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-headline-small text-on-surface mb-2">Connection Error</h2>
          <p className="text-body-medium text-on-surface-variant mb-4">{error}</p>
          <p className="text-body-small text-on-surface-variant">
            Please check your Supabase configuration in .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      {/* App Header */}
      <header className="bg-surface-light dark:bg-surface-dark surface-container-high dark:bg-surface-dark-container-high shadow-elevation-1 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-headline-large text-on-surface dark:text-white">Todo + Calendar</h1>
              <p className="text-body-medium text-on-surface-variant dark:text-gray-300">
                Organize your tasks and schedule your time beautifully
              </p>
            </div>
            
            {/* User Authentication & Controls */}
            <div className="flex items-center gap-4">
              {/* User Authentication */}
              <UserButton />
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-3 rounded-full bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black hover:bg-primary-40/90 dark:hover:bg-accent-dark-gold/90 transition-all duration-200 shadow-elevation-2"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="text-lg">{isDarkMode ? '☀️' : '🌙'}</span>
              </button>

              {/* Upgrade Button for Free Users */}
              {subscription?.plan === 'free' && (
                <button
                  onClick={() => setIsPricingModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-accent-dark-gold to-accent-dark-coral text-white rounded-full font-medium text-label-medium hover:shadow-elevation-3 transition-all duration-200 animate-pulse"
                >
                  ✨ Upgrade to Pro
                </button>
              )}
              {/* Main View Toggle */}
              <div className="flex items-center gap-2 surface-container dark:bg-surface-dark-container rounded-full p-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-4 py-2 rounded-full text-label-large font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-primary-40 dark:bg-accent-dark-coral text-on-primary dark:text-white shadow-elevation-2' 
                      : 'text-on-surface-variant dark:text-gray-300 hover:bg-on-surface/8 dark:hover:bg-white/10'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`px-4 py-2 rounded-full text-label-large font-medium transition-all duration-200 ${
                    viewMode === 'calendar' 
                      ? 'bg-primary-40 dark:bg-accent-dark-coral text-on-primary dark:text-white shadow-elevation-2' 
                      : 'text-on-surface-variant dark:text-gray-300 hover:bg-on-surface/8 dark:hover:bg-white/10'
                  }`}
                >
                  📅 Calendar
                </button>
              </div>
              
              {/* Calendar View Toggle - Only show when in calendar mode */}
              {viewMode === 'calendar' && (
                <div className="flex items-center gap-1 surface-container dark:bg-surface-dark-container rounded-lg p-1">
                  <button
                    onClick={() => handleCalendarViewChange('month')}
                    className={`px-3 py-1.5 rounded text-label-medium font-medium transition-all duration-200 ${
                      calendarView === 'month' 
                        ? 'bg-secondary-40 dark:bg-accent-dark-teal text-on-primary dark:text-white shadow-elevation-1' 
                        : 'text-on-surface-variant dark:text-gray-300 hover:bg-on-surface/8 dark:hover:bg-white/10'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => handleCalendarViewChange('week')}
                    className={`px-3 py-1.5 rounded text-label-medium font-medium transition-all duration-200 ${
                      calendarView === 'week' 
                        ? 'bg-secondary-40 dark:bg-accent-dark-teal text-on-primary dark:text-white shadow-elevation-1' 
                        : 'text-on-surface-variant dark:text-gray-300 hover:bg-on-surface/8 dark:hover:bg-white/10'
                    }`}
                  >
                    Week
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ProtectedContent 
        requireAuth={true}
        fallback={
          <main className="container mx-auto px-6 py-8 max-w-7xl">
            <div className="text-center max-w-4xl mx-auto">
              <div className="card-elevated p-12 mb-8 animate-scale-in">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-40 to-secondary-40 dark:from-accent-dark-gold dark:to-accent-dark-coral rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elevation-3">
                  <span className="text-4xl">✨</span>
                </div>
                <h2 className="text-display-small text-on-surface dark:text-white mb-4">
                  Welcome to Todo + Calendar
                </h2>
                <p className="text-title-medium text-on-surface-variant dark:text-gray-300 mb-8 leading-relaxed">
                  The most beautiful and intelligent task management app. Organize your life with voice commands, smart scheduling, and seamless cloud sync.
                </p>
                
                {/* Feature highlights */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="text-center p-6 surface-container dark:bg-surface-dark-container rounded-xl">
                    <div className="w-12 h-12 bg-primary-40/10 dark:bg-accent-dark-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🎤</span>
                    </div>
                    <h3 className="text-title-small text-on-surface dark:text-white mb-2">Voice Commands</h3>
                    <p className="text-body-small text-on-surface-variant dark:text-gray-400">Create and manage tasks naturally with advanced voice recognition</p>
                  </div>
                  <div className="text-center p-6 surface-container dark:bg-surface-dark-container rounded-xl">
                    <div className="w-12 h-12 bg-secondary-40/10 dark:bg-accent-dark-coral/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="text-title-small text-on-surface dark:text-white mb-2">Smart Scheduling</h3>
                    <p className="text-body-small text-on-surface-variant dark:text-gray-400">AI-powered time slot suggestions and intelligent task organization</p>
                  </div>
                  <div className="text-center p-6 surface-container dark:bg-surface-dark-container rounded-xl">
                    <div className="w-12 h-12 bg-tertiary-40/10 dark:bg-accent-dark-emerald/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">☁️</span>
                    </div>
                    <h3 className="text-title-small text-on-surface dark:text-white mb-2">Cloud Sync</h3>
                    <p className="text-body-small text-on-surface-variant dark:text-gray-400">Access your tasks anywhere with secure cloud synchronization</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsPricingModalOpen(true)}
                  className="btn-filled bg-gradient-to-r from-primary-40 to-secondary-40 dark:from-accent-dark-gold dark:to-accent-dark-coral text-on-primary dark:text-black px-8 py-3 text-title-small font-medium hover:shadow-elevation-4 transition-all duration-300"
                >
                  🚀 Get Started Free
                </button>
              </div>
            </div>
          </main>
        }
      >
        <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-8">
          {/* Left Column - Task Form & Stats */}
          <div className="space-y-8">
            {/* Subscription Banner */}
            <SubscriptionBanner 
              taskCount={tasks.length}
              onUpgradeClick={() => setIsPricingModalOpen(true)}
            />
            
            <TaskForm onSubmit={handleAddTask} />
            
            {/* Enhanced Stats Card */}
            <div className="card-elevated p-6 animate-slide-up">
              <h3 className="text-title-large font-medium text-on-surface mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Task Overview
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center surface-container p-4 rounded-xl">
                  <div className="text-display-small font-normal text-primary-40 mb-1">
                    {tasks.length}
                  </div>
                  <div className="text-body-small text-on-surface-variant">Total Tasks</div>
                </div>
                <div className="text-center surface-container p-4 rounded-xl">
                  <div className="text-display-small font-normal text-secondary-40 mb-1">
                    {tasks.filter(t => t.start).length}
                  </div>
                  <div className="text-body-small text-on-surface-variant">Scheduled</div>
                </div>
                <div className="text-center surface-container p-4 rounded-xl">
                  <div className="text-display-small font-normal text-error-40 mb-1">
                    {tasks.filter(t => t.priority === 'High').length}
                  </div>
                  <div className="text-body-small text-on-surface-variant">High Priority</div>
                </div>
                <div className="text-center surface-container p-4 rounded-xl">
                  <div className="text-display-small font-normal text-tertiary-40 mb-1">
                    {tasks.filter(t => !t.start).length}
                  </div>
                  <div className="text-body-small text-on-surface-variant">Unscheduled</div>
                </div>
              </div>
              
              {/* Notifications Toggle */}
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <button
                  onClick={handleNotificationToggle}
                  className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors duration-200 ${
                    notificationsEnabled 
                      ? 'bg-primary-40/10 text-primary-40' 
                      : 'bg-surface-light-container hover:bg-surface-light-container-high text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{notificationsEnabled ? '🔔' : '🔕'}</span>
                    <span className="text-body-medium">Task Reminders</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                    notificationsEnabled ? 'bg-primary-40' : 'bg-outline-variant'
                  } relative`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Export/Import */}
            <ExportImport 
              tasks={tasks}
              onImportTasks={importTasks || (() => {})}
            />

            {/* Advanced Voice Interface */}
            <AdvancedVoiceInterface
              tasks={tasks}
              onTaskCreate={addTask}
              onTaskUpdate={updateTask}
              onTaskDelete={deleteTask}
            />

            {/* Task Templates */}
            <TaskTemplates onApplyTemplate={handleApplyTemplate} />

            {/* Time Tracking */}
            <TimeTracking tasks={tasks} />

            {/* Productivity Analytics */}
            <ProductivityAnalytics tasks={tasks} />

            {/* Smart Voice Assistant */}
            <SmartVoiceAssistant 
              tasks={tasks} 
              onTaskCreate={addTask}
              onShowInsights={() => {}} 
            />
          </div>

          {/* Middle/Right Columns - Task Display */}
          <div className={viewMode === 'calendar' ? 'xl:col-span-2 lg:col-span-1' : ''}>
            {viewMode === 'list' ? (
              <CalendarList 
                tasks={tasks}
                onSuggestTime={handleSuggestTime}
                onDeleteTask={deleteTask}
              />
            ) : viewMode === 'calendar' && calendarView === 'week' ? (
              <CalendarWeekView
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onDateClick={calendar.handleDateClick}
                onTaskCreate={addTask}
                onTaskDelete={deleteTask}
                onTaskUpdate={updateTask}
              />
            ) : (
              <Calendar
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onDateClick={calendar.handleDateClick}
                onTaskCreate={addTask}
                onTaskDelete={deleteTask}
                onTaskUpdate={updateTask}
              />
            )}
          </div>
        </div>

        {/* Task Modal Placeholder */}
        {calendar.isTaskModalOpen && calendar.selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-elevated p-6 max-w-md w-full animate-scale-in">
              <h3 className="text-title-large font-medium text-on-surface mb-4">
                Task Details
              </h3>
              <div className="space-y-3">
                <p className="text-body-large text-on-surface">
                  {calendar.selectedTask.title}
                </p>
                <p className="text-body-medium text-on-surface-variant">
                  Priority: {calendar.selectedTask.priority}
                </p>
                {calendar.selectedTask.start && (
                  <p className="text-body-medium text-on-surface-variant">
                    Scheduled: {new Date(calendar.selectedTask.start).toLocaleString()}
                  </p>
                )}
                {calendar.selectedTask.durationMin && (
                  <p className="text-body-medium text-on-surface-variant">
                    Duration: {calendar.selectedTask.durationMin} minutes
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={calendar.closeTaskModal}
                  className="btn-filled flex-1"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    if (calendar.selectedTask) {
                      deleteTask(calendar.selectedTask.id);
                    }
                    calendar.closeTaskModal();
                  }}
                  className="btn-outlined text-error-40 border-error-40 hover:bg-error-40/8"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modals */}
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          onSelectPlan={handlePlanSelect}
          currentPlan={subscription?.plan}
        />

        {isPaymentModalOpen && selectedPlan && (
          <PaymentForm
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}
      </main>
      </ProtectedContent>

      {/* Footer */}
      <footer className="surface-container-high mt-16 py-6">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="text-body-small text-on-surface-variant">
            Beautiful Todo + Calendar • Built with Material 3 Design
          </p>
          <p className="text-body-small text-on-surface-variant opacity-70 mt-1">
            Backend: {backend === 'supabase' ? '🗄️ Supabase Database' : '💾 Local Storage'}
            {backend === 'localStorage' && (
              <span className="text-tertiary-40 ml-2">
                • <a href="/SUPABASE_SETUP.md" className="underline hover:no-underline">Setup Supabase for cloud sync</a>
              </span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;