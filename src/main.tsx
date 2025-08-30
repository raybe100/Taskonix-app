import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import { MobileErrorBoundary } from './components/MobileErrorBoundary'
import './index.css'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Mobile debugging setup
console.log('📱 Mobile Debug - App Starting');
console.log('📱 User Agent:', navigator.userAgent);
console.log('📱 Screen:', { width: window.innerWidth, height: window.innerHeight });
console.log('📱 Touch Points:', navigator.maxTouchPoints);
console.log('📱 Environment Variables Available:', Object.keys(import.meta.env));

// Global error handlers for mobile debugging
window.addEventListener('error', (event) => {
  console.error('🚨 Global JavaScript Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
    userAgent: navigator.userAgent
  });
  
  // Show error on screen for mobile debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; 
    background: red; color: white; padding: 10px; 
    z-index: 999999; font-size: 12px;
  `;
  errorDiv.textContent = `JS Error: ${event.message} at ${event.filename}:${event.lineno}`;
  document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  
  // Show promise error on screen
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 40px; left: 0; right: 0; 
    background: orange; color: white; padding: 10px; 
    z-index: 999999; font-size: 12px;
  `;
  errorDiv.textContent = `Promise Error: ${event.reason}`;
  document.body.appendChild(errorDiv);
});

// Web Speech API types are now defined in types.ts

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MobileErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </MobileErrorBoundary>
  </React.StrictMode>,
)