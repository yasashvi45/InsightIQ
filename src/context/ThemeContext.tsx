import { sanitizeForFirestore } from '../lib/firestoreUtils';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'green' | 'blue' | 'purple' | 'cyan';
export type FontSize = 'small' | 'medium' | 'large';

export interface UserPreferences {
  theme: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  roundedCorners: boolean;
  compactMode: boolean;
  animations: boolean;
  reducedMotion: boolean;
}

export const defaultPreferences: UserPreferences = {
  theme: 'dark',
  accentColor: 'green',
  fontSize: 'medium',
  roundedCorners: true,
  compactMode: false,
  animations: true,
  reducedMotion: false,
};

interface ThemeContextType {
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  savePreferences: (prefs: UserPreferences) => Promise<void>;
  savedPreferences: UserPreferences;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to determine if a route is public
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>(defaultPreferences);
  
  const isPublicRoute = publicRoutes.includes(location.pathname);
  // We only apply user theme if authenticated. Even if on a public page, if they are authenticated 
  // they usually redirect, but to be strictly safe per instructions: "Return the application to the default InsightIQ black + green theme. Navigate to the public/login page."
  // So if not authenticated, force defaults.
  const shouldApplyUserTheme = isAuthenticated && user !== null;

  useEffect(() => {
    if (!user) {
      setPreferences(defaultPreferences);
      setSavedPreferences(defaultPreferences);
      return;
    }

    const localKey = `insightiq-prefs-${user.id}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setPreferences(parsed);
        setSavedPreferences(parsed);
      } catch (e) {
        console.error("Error parsing local theme prefs", e);
      }
    }

    getDoc(doc(db, 'users', user.id, 'settings', 'appearance')).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserPreferences;
        // Merge with defaults in case of missing fields
        const merged = { ...defaultPreferences, ...data };
        setPreferences(merged);
        setSavedPreferences(merged);
        localStorage.setItem(localKey, JSON.stringify(merged));
      }
    }).catch(err => console.error("Error loading theme from firestore", err));
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Clear all
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-accent');
    root.removeAttribute('data-font-size');
    root.removeAttribute('data-rounded');
    root.removeAttribute('data-compact');
    root.removeAttribute('data-reduced-motion');
    root.removeAttribute('data-animations');

    if (!shouldApplyUserTheme) {
      // FORCE DEFAULT BRAND IDENTITY
      root.classList.add('dark');
      root.setAttribute('data-accent', 'green');
      return;
    }

    // Apply User Preferences
    let effectiveTheme = preferences.theme;
    if (preferences.theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (effectiveTheme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }

    root.setAttribute('data-accent', preferences.accentColor);
    root.setAttribute('data-font-size', preferences.fontSize);
    root.setAttribute('data-rounded', preferences.roundedCorners.toString());
    root.setAttribute('data-compact', preferences.compactMode.toString());
    root.setAttribute('data-reduced-motion', preferences.reducedMotion.toString());
    root.setAttribute('data-animations', preferences.animations.toString());

  }, [preferences, shouldApplyUserTheme]);

  const savePreferences = useCallback(async (newPrefs: UserPreferences) => {
    if (!user) return;
    
    const localKey = `insightiq-prefs-${user.id}`;
    setPreferences(newPrefs);
    setSavedPreferences(newPrefs);
    localStorage.setItem(localKey, JSON.stringify(newPrefs));
    
    await setDoc(doc(db, 'users', user.id, 'settings', 'appearance'), sanitizeForFirestore(newPrefs), { merge: true });
  }, [user]);

  return (
    <ThemeContext.Provider value={{ preferences, setPreferences, savePreferences, savedPreferences }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
