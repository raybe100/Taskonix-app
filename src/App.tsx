import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { CaptureScreen } from './components/CaptureScreen';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { LocationManager } from './components/LocationManager';
import { NotificationSettings } from './components/NotificationSettings';
import { UserButton } from './components/UserButton';
import { HelpButton } from './components/HelpButton';
import { HelpModal } from './components/HelpModal';
import { ProtectedContent } from './components/ProtectedContent';
import { useItemsStore } from './store/useItemsStore';
import { useDarkMode } from './hooks/useDarkMode';
import { ItemFormData } from './types';

type ViewMode = 'capture' | 'today' | 'calendar' | 'locations' | 'settings';

function App() {
  const { user } = useUser();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [currentView, setCurrentView] = useState<ViewMode>('capture');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  
  const {
    loading,
    error,
    initialized,
    addItem,
    loadData,
    clearError
  } = useItemsStore();

  // Initialize data when user is available
  useEffect(() => {
    if (user?.id && !initialized) {
      loadData(user.id);
    }
  }, [user?.id, initialized, loadData]);

  // Handle item creation from voice capture
  const handleItemCreate = async (itemData: ItemFormData) => {
    console.log('🎯 App.tsx handleItemCreate called with:', {
      title: itemData.title,
      type: itemData.type,
      hasUserId: !!user?.id,
      userId: user?.id
    });
    
    try {
      const createdItem = await addItem(itemData, user?.id);
      
      if (createdItem) {
        console.log('✅ Item successfully created, redirecting to today view');
        // Only redirect if creation was successful
        setCurrentView('today');
      } else {
        console.error('❌ Item creation failed - no item returned');
        // Stay on capture screen to show error
      }
    } catch (error) {
      console.error('❌ Item creation threw error:', error);
      // Stay on capture screen to show error
    }
  };

  // Navigation items
  const navigationItems = [
    { id: 'capture', label: 'Voice', icon: '🎤', description: 'Voice Capture' },
    { id: 'today', label: 'Today', icon: '📅', description: 'Today\'s Agenda' },
    { id: 'calendar', label: 'Calendar', icon: '🗓️', description: 'Calendar View' },
    { id: 'locations', label: 'Places', icon: '📍', description: 'Saved Locations' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Preferences' }
  ];

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'capture':
        return <CaptureScreen onItemCreate={handleItemCreate} onNavigate={setCurrentView} />;
      case 'today':
        return <TodayView />;
      case 'calendar':
        return <CalendarView />;
      case 'locations':
        return <LocationManager />;
      case 'settings':
        return <NotificationSettings />;
      default:
        return (
          <div className="p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Default View</h1>
            <p className="text-gray-600 dark:text-gray-300">Current view: {currentView}</p>
          </div>
        );
    }
  };

  if (loading && !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-sm mx-4">
          <div className="w-16 h-16 border-4 border-primary-40 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Initializing Taskonix
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Setting up your voice-first experience...
          </p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md mx-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Minimal Left-Aligned Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left-aligned Logo and Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
                <img 
                  src="/taskonix-logo.png" 
                  alt="Taskonix Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent">
                  TASKONIX
                </h1>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Help button */}
              <HelpButton onClick={() => setIsHelpOpen(true)} />
              
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                <span className="text-lg">{isDarkMode ? '☀️' : '🌙'}</span>
              </button>
              {/* User button */}
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Mobile Bottom Navigation / Desktop Side Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:static md:w-80 md:border-r md:border-t-0 md:min-h-screen z-50 md:bg-gradient-to-b md:from-gray-50/80 md:to-white/90 md:dark:from-gray-900/90 md:dark:to-gray-800/95 md:backdrop-blur-lg">
          {/* Desktop Header */}
          <div className="hidden md:block p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center mb-3">
              <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                YOUR COMMAND CENTRE
              </h2>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex md:flex-col px-2 py-2 md:p-4 md:space-y-2 justify-around md:justify-start">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewMode)}
                className={`group relative flex-1 md:flex-none flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 p-2 md:p-4 rounded-lg md:rounded-xl transition-all duration-200 transform hover:scale-[1.02] min-h-[60px] md:min-h-auto ${
                  currentView === item.id
                    ? 'text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg md:shadow-xl md:border-r-4 border-white/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/50 md:hover:bg-gradient-to-br md:hover:from-gray-100/80 md:hover:to-gray-200/40 md:dark:hover:from-gray-800/50 md:dark:hover:to-gray-700/30'
                }`}
              >
                {/* Active indicator for desktop */}
                {currentView === item.id && (
                  <div className="hidden md:block absolute -left-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full opacity-90"></div>
                )}
                
                {/* Icon with background */}
                <div className={`flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-xl transition-all duration-200 ${
                  currentView === item.id 
                    ? 'bg-white/20 shadow-lg' 
                    : 'bg-gray-100/50 dark:bg-gray-800/30 group-hover:bg-gray-200/80 dark:group-hover:bg-gray-700/50'
                }`}>
                  <span className={`transition-all duration-200 ${
                    currentView === item.id 
                      ? 'text-2xl md:text-3xl' 
                      : 'text-xl md:text-2xl group-hover:scale-110'
                  }`}>
                    {item.icon}
                  </span>
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col md:flex-1 md:items-start text-center md:text-left">
                  <span className={`font-semibold transition-all duration-200 ${
                    currentView === item.id 
                      ? 'text-xs md:text-lg text-white' 
                      : 'text-xs md:text-base group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Description - only on desktop */}
                  <span className={`hidden md:block text-xs mt-1 transition-all duration-200 ${
                    currentView === item.id 
                      ? 'text-white/80' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}>
                    {item.description}
                  </span>
                </div>

                {/* Subtle glow effect for active item */}
                {currentView === item.id && (
                  <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl blur-xl -z-10"></div>
                )}
              </button>
            ))}
          </div>

          {/* Desktop Footer */}
          <div className="hidden md:block mt-auto p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-white text-sm">✨</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Voice-powered productivity at your fingertips
              </p>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 pb-24 md:pb-0 w-full">
          <ProtectedContent
            requireAuth={true}
            fallback={
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="text-center max-w-3xl">
                  <div className="w-40 h-40 mx-auto mb-8 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/30">
                    <img 
                      src="/taskonix-logo.png" 
                      alt="Taskonix Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent mb-6 tracking-tight">
                    TASKONIX
                  </h1>
                  
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 tracking-wide">
                    VOICE-POWERED PRODUCTIVITY
                  </p>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
                    The most intelligent voice-first task management experience. 
                    Simply speak your tasks, and watch AI organize your life effortlessly.
                  </p>

                  {/* Feature highlights */}
                  <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🎙️</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Voice Recognition
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Advanced AI understands natural speech and extracts dates, locations, and priorities automatically
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📍</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Smart Reminders
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Location-aware notifications remind you when you arrive at places or need to leave for appointments
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📱</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Mobile First
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Optimized for mobile with touch-friendly interfaces and seamless cross-device sync
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Try saying:
                    </h3>
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      <p className="text-gray-600 dark:text-gray-300 italic">
                        "Team meeting tomorrow at 3pm urgent"
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 italic">
                        "Dentist appointment Friday at 2pm"
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 italic">
                        "Buy groceries at Whole Foods Saturday"
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 mt-8">
                    Sign in to start organizing your life with voice
                  </p>
                </div>
              </div>
            }
          >
            {renderCurrentView()}
          </ProtectedContent>
        </main>
      </div>

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />
    </div>
  );
}

export default App;