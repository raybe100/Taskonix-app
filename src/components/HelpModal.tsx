import { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState('getting-started');

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">
              Welcome to Taskonix! 🎉
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-lg mb-4">
              This app helps you remember things by just talking to it! It's like having a smart friend who never forgets.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Here's how easy it is:</h4>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center text-lg font-bold">1</div>
                <div>
                  <h5 className="font-semibold text-green-900 dark:text-green-100">Find the big microphone button 🎤</h5>
                  <p className="text-green-800 dark:text-green-200">Look for the round button with the microphone icon. It's usually big and colorful!</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center text-lg font-bold">2</div>
                <div>
                  <h5 className="font-semibold text-purple-900 dark:text-purple-100">Hold down and talk 🗣️</h5>
                  <p className="text-purple-800 dark:text-purple-200">Press and hold the button, then say what you need to do. Let go when you're done talking!</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="w-8 h-8 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center text-lg font-bold">3</div>
                <div>
                  <h5 className="font-semibold text-orange-900 dark:text-orange-100">Check if it looks right ✅</h5>
                  <p className="text-orange-800 dark:text-orange-200">The app will show you what it heard. Make sure the date and time are correct!</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="w-8 h-8 bg-pink-200 dark:bg-pink-800 rounded-full flex items-center justify-center text-lg font-bold">4</div>
                <div>
                  <h5 className="font-semibold text-pink-900 dark:text-pink-100">Save your task 💾</h5>
                  <p className="text-pink-800 dark:text-pink-200">Click "Save Task" and you're done! The app will remember it for you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice-examples',
      title: 'Using Your Voice',
      icon: '🎤',
      content: (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-4">
              What to Say 💬
            </h3>
            <p className="text-green-800 dark:text-green-200 text-lg">
              Just talk normally! The app is really smart and understands lots of different ways to say things.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Try saying these:</h4>
            
            <div className="grid gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">For appointments:</div>
                <div className="space-y-1 text-blue-800 dark:text-blue-200">
                  <p>"Dentist appointment Thursday at 3pm"</p>
                  <p>"Mom's birthday party Saturday"</p>
                  <p>"Soccer practice tomorrow at 4"</p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-400">
                <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">For shopping:</div>
                <div className="space-y-1 text-purple-800 dark:text-purple-200">
                  <p>"Buy milk and bread"</p>
                  <p>"Get groceries at 5pm today"</p>
                  <p>"Pick up medicine from pharmacy"</p>
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                <div className="font-semibold text-orange-900 dark:text-orange-100 mb-2">For school/work:</div>
                <div className="space-y-1 text-orange-800 dark:text-orange-200">
                  <p>"Math homework due Friday"</p>
                  <p>"Team meeting tomorrow urgent"</p>
                  <p>"Call teacher about project"</p>
                </div>
              </div>

              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-l-4 border-pink-400">
                <div className="font-semibold text-pink-900 dark:text-pink-100 mb-2">For fun stuff:</div>
                <div className="space-y-1 text-pink-800 dark:text-pink-200">
                  <p>"Movie night with friends Friday"</p>
                  <p>"Walk the dog at 6pm"</p>
                  <p>"Call grandma this weekend"</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl">
            <h4 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">💡 Pro Tips:</h4>
            <ul className="space-y-2 text-yellow-800 dark:text-yellow-200">
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Say the day and time clearly: "Thursday at 3pm" works better than "Thursday 3"</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Add "urgent" or "important" for important tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Mention places: "at the dentist", "at school", "at home"</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'navigation',
      title: 'Understanding the App',
      icon: '📱',
      content: (
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4">
              Getting Around 🗺️
            </h3>
            <p className="text-purple-800 dark:text-purple-200 text-lg">
              The app has 5 main sections. Each one does something different!
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-xl flex items-center justify-center text-2xl">🎤</div>
              <div>
                <h5 className="font-semibold text-red-900 dark:text-red-100 text-lg">Voice</h5>
                <p className="text-red-800 dark:text-red-200">This is where you talk to the app! Press the big button and say what you need to do.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-xl flex items-center justify-center text-2xl">📅</div>
              <div>
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Today</h5>
                <p className="text-blue-800 dark:text-blue-200">See everything you have planned for today. Like a daily planner!</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-xl flex items-center justify-center text-2xl">🗓️</div>
              <div>
                <h5 className="font-semibold text-green-900 dark:text-green-100 text-lg">Calendar</h5>
                <p className="text-green-800 dark:text-green-200">Look at your whole month! See what's coming up next week or next month.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="w-12 h-12 bg-yellow-200 dark:bg-yellow-800 rounded-xl flex items-center justify-center text-2xl">📍</div>
              <div>
                <h5 className="font-semibold text-yellow-900 dark:text-yellow-100 text-lg">Places</h5>
                <p className="text-yellow-800 dark:text-yellow-200">Save important places like your school, home, or favorite store so the app knows where they are.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl">⚙️</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Settings</h5>
                <p className="text-gray-800 dark:text-gray-200">Change how the app works. You can turn notifications on/off and other cool stuff.</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">🔄 Moving Around:</h4>
            <ul className="space-y-2 text-indigo-800 dark:text-indigo-200">
              <li className="flex items-start gap-2">
                <span>👆</span>
                <span><strong>On phones:</strong> Use the buttons at the bottom of your screen</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🖱️</span>
                <span><strong>On computers:</strong> Click the buttons on the left side</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Common Questions',
      icon: '❓',
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-4">
              Need Help? 🆘
            </h3>
            <p className="text-red-800 dark:text-red-200 text-lg">
              Don't worry! Here are answers to questions that lots of people ask.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔇 "The app didn't hear me!"</h4>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Try this:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Make sure your microphone is turned on</li>
                  <li>Speak clearly and not too fast</li>
                  <li>Hold the button down the whole time you're talking</li>
                  <li>Try moving somewhere quieter</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🗓️ "The date/time is wrong!"</h4>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Try this:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Say the day clearly: "Thursday" not "Thurs"</li>
                  <li>Say the time like this: "3pm" or "3 o'clock"</li>
                  <li>You can fix it in the popup that appears</li>
                  <li>Click on the time fields to change them</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔍 "I can't find my task!"</h4>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Check these places:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Today section 📅 - for today's tasks</li>
                  <li>Calendar section 🗓️ - for future tasks</li>
                  <li>Maybe you saved it for a different day?</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📱 "The app looks weird on my phone!"</h4>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Try this:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Turn your phone to portrait mode (up and down)</li>
                  <li>Close and reopen the app</li>
                  <li>Make sure you have a good internet connection</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
            <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">💡 Still need help?</h4>
            <p className="text-green-800 dark:text-green-200">
              Try closing this help window and practicing with the voice button. The more you use it, the easier it gets! 
              Remember: you can always come back to this help anytime by clicking the ? button.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Tips & Tricks',
      icon: '💡',
      content: (
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">
              Become a Taskonix Pro! 🌟
            </h3>
            <p className="text-yellow-800 dark:text-yellow-200 text-lg">
              Here are some cool tricks to make the app work even better for you!
            </p>
          </div>

          <div className="grid gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <span>🎯</span> Be Specific
              </h4>
              <div className="space-y-2 text-blue-800 dark:text-blue-200">
                <p><strong>Instead of:</strong> "Homework"</p>
                <p><strong>Try saying:</strong> "Math homework due tomorrow"</p>
                <p className="text-sm italic">The app works better when you give it more details!</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <span>⏰</span> Use Time Words
              </h4>
              <div className="space-y-2 text-purple-800 dark:text-purple-200">
                <p><strong>Good words to use:</strong></p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• "tomorrow" • "next week" • "Monday"</div>
                  <div>• "at 3pm" • "urgent" • "important"</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <span>📍</span> Save Your Places
              </h4>
              <div className="space-y-2 text-green-800 dark:text-green-200">
                <p>Go to Places 📍 and add your important locations like:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• Your school • The gym • Doctor's office</div>
                  <div>• Grocery store • Friend's house • Work</div>
                </div>
                <p className="text-sm italic">Then you can just say "dentist appointment" and the app will know where!</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                <span>🔄</span> Check Your Work
              </h4>
              <div className="space-y-2 text-orange-800 dark:text-orange-200">
                <p>Always look at the popup before clicking "Save":</p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                  <li>Is the title correct?</li>
                  <li>Is the date and time right?</li>
                  <li>Does it say "Event" or "Task" correctly?</li>
                </ul>
                <p className="text-sm italic">You can change anything that doesn't look right!</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3">🎉 Fun Challenge:</h4>
            <p className="text-indigo-800 dark:text-indigo-200 mb-3">
              Try using the app for one whole day! Add everything you need to do - homework, chores, fun activities, everything!
            </p>
            <p className="text-indigo-800 dark:text-indigo-200 text-sm italic">
              You'll be amazed at how much easier it is to remember things when the app helps you organize them!
            </p>
          </div>
        </div>
      )
    }
  ];

  const activeContent = helpSections.find(section => section.id === activeSection);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl animate-scale-in">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">❓</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  How to use Taskonix
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Easy instructions for everyone
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close help"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700">
              <div className="p-4 space-y-2">
                {helpSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{section.icon}</span>
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 max-h-[70vh] overflow-y-auto">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{activeContent?.icon}</span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeContent?.title}
                  </h3>
                </div>
                
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {activeContent?.content}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 rounded-b-3xl">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Need more help? The best way to learn is by trying! 
                <span className="ml-2">🚀</span>
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Got it, let me try! ✨
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}