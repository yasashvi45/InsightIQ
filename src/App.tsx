/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Forecast } from './pages/Forecast';
import { Reports } from './pages/Reports';
import { Assistant } from './pages/Assistant';
import { Insights } from './pages/Insights';
import { Landing } from './pages/Landing';
import { DemoLoader } from './pages/DemoLoader';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { SetupWizard } from './pages/SetupWizard';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Billing } from './pages/Billing';
import { Notifications } from './pages/Notifications';
import { NotFound } from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { useAuth } from './context/AuthContext';
import { NotificationService } from './lib/NotificationService';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Need to get the auth user somehow. Wait, App is rendered OUTSIDE AuthProvider's hook scope in some places, but we can't use useAuth here directly without moving it.
  // Actually, I can just use auth.currentUser from firebase directly since we only need the id.
  
  useEffect(() => {
    const handleOnline = () => { 
      setIsOnline(true); 
      toast.success('Network recovered. You are back online.'); 
      
      import('./lib/firebase').then(({ auth }) => {
        if (auth.currentUser) {
          NotificationService.createNotification(auth.currentUser.uid, {
            title: 'Connection Restored',
            description: 'Network connection has been recovered.',
            type: 'system',
            priority: 'success'
          }).catch(console.warn);
        }
      });
    };
    const handleOffline = () => { 
      setIsOnline(false); 
      toast.error('You are offline. Some features may be unavailable.'); 
      
      import('./lib/firebase').then(({ auth }) => {
        if (auth.currentUser) {
          NotificationService.createNotification(auth.currentUser.uid, {
            title: 'Network Error',
            description: 'You are currently offline. Operations will sync when you reconnect.',
            type: 'system',
            priority: 'error'
          }).catch(console.warn);
        }
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <NotificationProvider>
          <DataProvider>
            <Toaster position="top-center" />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/demo" element={<DemoLoader />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={
              <ProtectedRoute requireOnboarding={false}>
                <SetupWizard />
              </ProtectedRoute>
            } />
            
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </DataProvider>
        </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
