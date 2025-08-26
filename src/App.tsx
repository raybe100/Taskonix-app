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
} from './lib/notifications';

function App() {
  useUser();
  const { 
    tasks, 
    loading, 
    error,
    addTask, 
    deleteTask, 
    updateTask,
    suggestTimeSlot,
    backend 
  } = useHybridTasks();
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    return (localStorage.getItem('taskonix-view-mode') as 'list' | 'calendar') || 'list';
  });
  const [calendarView, setCalendarView] = useState<'month' | 'week'>(() => {
    return (localStorage.getItem('taskonix-calendar-view') as 'month' | 'week') || 'month';
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
    localStorage.setItem('taskonix-view-mode', mode);
  };

  const handleCalendarViewChange = (view: 'month' | 'week') => {
    setCalendarView(view);
    localStorage.setItem('taskonix-calendar-view', view);
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

  // Direct DOM modal as last resort
  useEffect(() => {
    console.log('useEffect: isPricingModalOpen changed to:', isPricingModalOpen);
    
    if (isPricingModalOpen) {
      // Remove any existing modal
      const existing = document.getElementById('emergency-modal');
      if (existing) {
        existing.remove();
      }
      
      // Create modal directly
      const modal = document.createElement('div');
      modal.id = 'emergency-modal';
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        backdrop-filter: blur(4px) !important;
        z-index: 9999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      `;
      
      modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-width: 500px; text-align: center;">
          <h1 style="color: #1f2937; font-size: 32px; font-weight: bold; margin-bottom: 16px;">Choose Your Plan</h1>
          <p style="color: #6b7280; font-size: 18px; margin-bottom: 32px;">Select a plan to get started with Taskonix</p>
          
          <div style="margin-bottom: 24px;">
            <button id="free-plan" style="display: block; width: 100%; padding: 20px; margin-bottom: 16px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; text-align: left;">
              <div style="font-weight: 600; color: #1f2937; font-size: 18px; margin-bottom: 4px;">Free Plan</div>
              <div style="color: #6b7280; font-size: 14px;">$0/month - Basic task management</div>
            </button>
            
            <button id="pro-plan" style="display: block; width: 100%; padding: 20px; margin-bottom: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; cursor: pointer; text-align: left; color: white;">
              <div style="font-weight: 600; font-size: 18px; margin-bottom: 4px;">Pro Plan</div>
              <div style="opacity: 0.9; font-size: 14px;">$9.99/month - All premium features</div>
            </button>
          </div>
          
          <button id="close-pricing" style="background: #6b7280; color: white; padding: 12px 24px; font-size: 16px; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
            Close
          </button>
        </div>
      `;
      
      // Add to body
      document.body.appendChild(modal);
      
      // Add event handlers
      document.getElementById('free-plan')!.onclick = () => {
        console.log('Free plan selected');
        handlePlanSelect({ id: 'free', name: 'Free', price: 0, interval: 'month', features: [] });
      };
      
      document.getElementById('pro-plan')!.onclick = () => {
        console.log('Pro plan selected');
        handlePlanSelect({ id: 'pro', name: 'Pro', price: 9.99, interval: 'month', features: [] });
      };
      
      document.getElementById('close-pricing')!.onclick = () => {
        setIsPricingModalOpen(false);
      };
      
      console.log('Emergency modal created and added to body');
    } else {
      // Remove modal when closed
      const existing = document.getElementById('emergency-modal');
      if (existing) {
        existing.remove();
        console.log('Emergency modal removed');
      }
    }
  }, [isPricingModalOpen]);

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
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Taskonix Logo" 
                className="w-12 h-12 rounded-full shadow-elevation-2"
              />
              <div>
                <h1 className="text-headline-large text-on-surface dark:text-white">Taskonix</h1>
                <p className="text-body-medium text-on-surface-variant dark:text-gray-300">
                  Master your time, conquer your goals
                </p>
              </div>
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
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-elevation-3 overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Taskonix Logo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h2 className="text-display-small text-on-surface dark:text-white mb-4">
                  Welcome to Taskonix
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
                  onClick={() => {
                    console.log('Get Started Free clicked!');
                    console.log('Current modal state:', isPricingModalOpen);
                    setIsPricingModalOpen(true);
                    console.log('Modal should now be:', true);
                  }}
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
              onImportTasks={() => {}}
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
        {isPricingModalOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255, 0, 0, 0.9)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '10px',
              border: '5px solid blue',
              maxWidth: '600px',
              width: '100%',
              color: 'black'
            }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>Choose Your Plan</h2>
              <p style={{ fontSize: '18px', marginBottom: '30px' }}>Select a plan to get started with Taskonix</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    console.log('Free plan selected');
                    handlePlanSelect({ id: 'free', name: 'Free', price: 0, interval: 'month', features: [] });
                  }}
                  className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">Free Plan</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">$0/month - Basic features</div>
                </button>
                
                <button 
                  onClick={() => {
                    console.log('Pro plan selected');
                    handlePlanSelect({ id: 'pro', name: 'Pro', price: 9.99, interval: 'month', features: [] });
                  }}
                  className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">Pro Plan</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">$9.99/month - All features</div>
                </button>
              </div>
              
              <button 
                onClick={() => {
                  console.log('Close clicked');
                  setIsPricingModalOpen(false);
                }}
                className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        )}

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
            Beautiful Taskonix • Built with Material 3 Design
          </p>
          <p className="text-body-small text-on-surface-variant opacity-70 mt-1">
            Backend: {backend === 'supabase' ? '🗄️ Supabase Database' : '💾 Local Storage'}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;