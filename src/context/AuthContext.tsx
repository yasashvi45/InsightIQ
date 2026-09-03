import { sanitizeForFirestore } from '../lib/firestoreUtils';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationService } from '../lib/NotificationService';

export interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  industry?: string;
  companySize?: string;
  role?: string;
  website?: string;
  logoUrl?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  locale?: string;
  numberFormat?: string;
  dateFormat?: string;
  updatedAt?: string;
  createdAt?: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  uploads?: {name: string; size: number; type: string; uploadedAt: string}[];
}

interface AuthContextType {
  isDemoMode: boolean;
  startDemoMode: () => void;
  exitDemoMode: () => void;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ onboardingCompleted: boolean }>;
  loginWithGoogle: () => Promise<{ onboardingCompleted: boolean }>;
  signup: (data: Partial<User> & { password?: string }) => Promise<{ onboardingCompleted: boolean }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const isDemoModeRef = React.useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const credential = await getRedirectResult(auth);
        if (credential) {
          const firebaseUser = credential.user;
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let onboardingCompleted = false;
          if (!userDoc.exists()) {
            await setDoc(userDocRef, sanitizeForFirestore({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              photoURL: firebaseUser.photoURL,
              provider: 'google',
              onboardingCompleted: false,
              createdAt: new Date().toISOString()
            }));
            onboardingCompleted = false;
          } else {
            onboardingCompleted = !!userDoc.data().onboardingCompleted;
          }
          
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(onboardingCompleted ? from : '/onboarding', { replace: true });
        }
      } catch (error) {
        console.error('Google redirect sign in error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isDemoMode) return;
      if (isDemoModeRef.current) return;
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          console.log('[Firestore] Attempting to fetch user profile document for:', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            console.log('[Firestore] User document found.');
            const userData = userDoc.data() as any;
            
            // Also fetch settings subcollections
            let profileData = {};
            let workspaceData = {};
            let preferencesData = {};
            let appearanceData: any = {};
            try {
              const [profileSnap, workspaceSnap, preferencesSnap, appearanceSnap] = await Promise.all([
                getDoc(doc(db, 'users', firebaseUser.uid, 'settings', 'profile')),
                getDoc(doc(db, 'users', firebaseUser.uid, 'settings', 'workspace')),
                getDoc(doc(db, 'users', firebaseUser.uid, 'settings', 'preferences')),
                getDoc(doc(db, 'users', firebaseUser.uid, 'settings', 'appearance'))
              ]);
              if (profileSnap.exists()) profileData = profileSnap.data();
              if (workspaceSnap.exists()) workspaceData = workspaceSnap.data();
              if (preferencesSnap.exists()) preferencesData = preferencesSnap.data();
              if (appearanceSnap.exists()) {
                appearanceData = appearanceSnap.data();
                if (appearanceData.theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (appearanceData.theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch (err) {
              console.warn('Failed to fetch settings subcollections', err);
            }

            const combinedData = { ...userData, ...profileData, ...workspaceData, ...preferencesData };

            setUser({
              id: firebaseUser.uid,
              email: combinedData.email || firebaseUser.email || '',
              name: combinedData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              businessName: combinedData.businessName,
              industry: combinedData.industry,
              companySize: combinedData.companySize,
              role: combinedData.role,
              website: combinedData.website,
              logoUrl: combinedData.logoUrl,
              country: combinedData.country,
              timezone: combinedData.timezone,
              currency: combinedData.currency,
              language: combinedData.language,
              locale: combinedData.locale,
              numberFormat: combinedData.numberFormat,
              dateFormat: combinedData.dateFormat,
              createdAt: combinedData.createdAt,
              updatedAt: combinedData.updatedAt,
              avatarUrl: combinedData.avatarUrl || firebaseUser.photoURL || undefined,
              onboardingCompleted: combinedData.onboardingCompleted || false,
            });
          } else {
            console.log('[Firestore] User document not found. Attempting to create basic profile.');
            // If the user document doesn't exist, create a basic one
            const newUserData: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              onboardingCompleted: false,
            };
            try {
              await setDoc(userDocRef, sanitizeForFirestore({
                name: newUserData.name,
                onboardingCompleted: false
              }));
              console.log('[Firestore] Basic profile document created successfully.');
            } catch (error) {
              console.warn('[Firestore] Failed to create basic user document:', error);
            }
            setUser(newUserData);
          }
        } catch (error) {
          console.warn('[Firestore] Failed to fetch user document. Check Firestore Rules.', error);
          // Fallback to Firebase Auth user data if Firestore fails
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
            onboardingCompleted: false,
          });
        }
      } else {
        // Clear all client-side session data when user becomes null
        if (!isDemoMode) setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', credential.user.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      
      NotificationService.createNotification(credential.user.uid, {
        title: 'New Login',
        description: `Successfully logged in to your account.`,
        type: 'system',
        priority: 'success'
      }).catch(console.warn);

      if (userDoc.exists()) {
        return { onboardingCompleted: !!userDoc.data().onboardingCompleted };
      }
    } catch (e) {
      console.warn('Failed to fetch user profile in Firestore:', e);
    }
    return { onboardingCompleted: false };
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const isIframe = window.self !== window.top;

    if (isIframe) {
      console.log('Running in iframe, using signInWithRedirect');
      await signInWithRedirect(auth, provider);
      // The code below won't run because the page redirects
      return { onboardingCompleted: false };
    } else {
      console.log('Not in iframe, using signInWithPopup');
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, sanitizeForFirestore({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
            photoURL: firebaseUser.photoURL,
            provider: 'google',
            onboardingCompleted: false,
            createdAt: new Date().toISOString()
          }));
          return { onboardingCompleted: false };
        } else {
          return { onboardingCompleted: !!userDoc.data().onboardingCompleted };
        }
      } catch (error) {
        console.warn('Failed to fetch/create user profile in Firestore:', error);
        throw error;
      }
    }
  };

  const signup = async (data: Partial<User> & { password?: string }) => {
    if (!data.email || !data.password) throw new Error('Email and password are required');
    
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    console.log('[Auth] User account created in Firebase Auth:', firebaseUser.uid);

    if (data.name) {
      try {
        console.log('[Auth] Updating Firebase Auth profile name to:', data.name);
        await updateFirebaseProfile(firebaseUser, { displayName: data.name });
        console.log('[Auth] Profile name updated successfully.');
      } catch (e) {
        console.warn('[Auth] Failed to update profile name:', e);
      }
    }

    const newUserData = {
      name: data.name || data.email.split('@')[0],
      businessName: data.businessName || `${data.name || 'User'}'s Workspace`,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('[Firestore] Attempting to create user profile document in "users" collection...');
      await setDoc(doc(db, 'users', firebaseUser.uid), sanitizeForFirestore(newUserData));
      console.log('[Firestore] Profile document created successfully.');
    } catch (error) {
      console.warn('[Firestore] Failed to create Firestore profile document:', error);
    }
    
    return { onboardingCompleted: false };
  };

  const logout = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      isDemoModeRef.current = false;
      setUser(null);
      navigate('/', { replace: true });
      return;
    }
    try {
      await signOut(auth);
      // Immediately clear all client-side state for snappy UI updates
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.id);
    const updateData: Record<string, any> = { 
      ...data, 
      updatedAt: new Date().toISOString() 
    };
    // Remove fields that shouldn't be in Firestore profile
    delete updateData.id;
    delete updateData.email;

    try {
      await updateDoc(userDocRef, sanitizeForFirestore(updateData));
      
      // Also update subcollections for settings consistency
      const profileData: any = {};
      const workspaceData: any = {};
      const preferencesData: any = {};

      if (data.name !== undefined) profileData.name = data.name;
      if (data.role !== undefined) profileData.role = data.role;
      if (data.avatarUrl !== undefined) profileData.avatarUrl = data.avatarUrl;

      if (data.businessName !== undefined) workspaceData.businessName = data.businessName;
      if (data.industry !== undefined) workspaceData.industry = data.industry;
      if (data.companySize !== undefined) workspaceData.companySize = data.companySize;
      if (data.website !== undefined) workspaceData.website = data.website;
      if (data.logoUrl !== undefined) workspaceData.logoUrl = data.logoUrl;

      if (data.country !== undefined) preferencesData.country = data.country;
      if (data.timezone !== undefined) preferencesData.timezone = data.timezone;
      if (data.currency !== undefined) preferencesData.currency = data.currency;
      if (data.language !== undefined) preferencesData.language = data.language;
      if (data.dateFormat !== undefined) preferencesData.dateFormat = data.dateFormat;
      if (data.numberFormat !== undefined) preferencesData.numberFormat = data.numberFormat;

      if (Object.keys(profileData).length > 0) {
        await setDoc(doc(db, 'users', user.id, 'settings', 'profile'), sanitizeForFirestore(profileData), { merge: true });
      }
      if (Object.keys(workspaceData).length > 0) {
        await setDoc(doc(db, 'users', user.id, 'settings', 'workspace'), sanitizeForFirestore(workspaceData), { merge: true });
      }
      if (Object.keys(preferencesData).length > 0) {
        await setDoc(doc(db, 'users', user.id, 'settings', 'preferences'), sanitizeForFirestore(preferencesData), { merge: true });
      }

      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: data.name !== undefined ? data.name : auth.currentUser.displayName,
          photoURL: data.avatarUrl !== undefined ? data.avatarUrl : auth.currentUser.photoURL
        });
      }

      NotificationService.createNotification(user.id, {
        title: 'Profile Updated',
        description: 'Your profile settings have been updated successfully.',
        type: 'system',
        priority: 'success'
      }).catch(console.warn);
    } catch (error) {
      console.warn('Failed to update Firestore profile:', error);
    }
    setUser({ ...user, ...data });
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, sanitizeForFirestore({ onboardingCompleted: true, updatedAt: new Date().toISOString() }), { merge: true });
    setUser({ ...user, onboardingCompleted: true });
  };

  return (
    <AuthContext.Provider
      value={{
        isDemoMode,
        startDemoMode: () => {
          setIsDemoMode(true);
          isDemoModeRef.current = true;
          setUser({
            id: 'demo',
            email: 'demo@insightiq.ai',
            name: 'Demo User',
            onboardingCompleted: true
          });
          setIsLoading(false);
          navigate('/dashboard', { replace: true });
        },
        exitDemoMode: () => {
          setIsDemoMode(false);
          isDemoModeRef.current = false;
          setUser(null);
          navigate('/signup', { replace: true });
        },
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
        resetPassword,
        updateProfile,
        completeOnboarding
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
