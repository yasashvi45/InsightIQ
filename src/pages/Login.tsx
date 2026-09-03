import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';

export function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    setError(null);
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      navigate(result.onboardingCompleted ? from : '/onboarding', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' && err.message.includes('not found')) {
        setError('No account found. Please create an account first.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        // Firebase auth generic invalid-credential often covers wrong password
        setError('Incorrect password.');
      } else {
        setError(err.message || 'Invalid email or password');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      navigate(result.onboardingCompleted ? from : '/onboarding', { replace: true });
    } catch (err: any) {
      console.error('Google sign in error:', err);
      console.error('Code:', err.code);
      console.error('Message:', err.message);
      setError(`Google sign in failed: ${err.code || err.message}`);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        
        <Link to="/" className="absolute top-8 left-8 sm:left-12 hidden sm:flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(18,209,142,0.4)] transition-all">
            <Sparkles className="w-5 h-5 text-[var(--color-brand-bg)]" />
          </div>
          <span className="font-heading font-semibold text-xl tracking-tight text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">InsightIQ</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="mb-10 flex flex-col sm:block items-center text-center sm:text-left mt-12 sm:mt-0">
            <Link to="/" className="flex sm:hidden items-center gap-3 group mb-6">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--color-brand-bg)]" />
              </div>
              <span className="font-heading font-semibold text-xl tracking-tight text-[var(--color-brand-text)]">InsightIQ</span>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-2 tracking-tight flex items-center justify-center sm:justify-start gap-3">
              Welcome back
            </h1>
            <p className="text-[var(--color-brand-muted)]">Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-xl flex items-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-brand-muted)]">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] transition-colors focus:outline-none focus:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                  disabled={isLoading || isGoogleLoading}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isGoogleLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-brand-border)] bg-[var(--color-brand-card)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)] focus:ring-offset-0 cursor-pointer" 
                disabled={isLoading || isGoogleLoading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-[var(--color-brand-muted)] cursor-pointer select-none">Remember me for 30 days</label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_14px_rgba(18,209,142,0.2)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to InsightIQ'}
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-brand-border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)]">Or continue with</span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] font-medium rounded-xl hover:border-[var(--color-brand-muted)] transition-all hover:bg-[var(--color-brand-bg)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-brand-muted)]">
            Don't have an account? <Link to="/signup" className="font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] transition-colors focus:outline-none focus:underline">Create Account</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Abstract Graphic */}
      <div className="hidden lg:flex flex-1 relative bg-[var(--color-brand-card)] border-l border-[var(--color-brand-border)] items-center justify-center overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-brand-primary)]/10 rounded-full blur-[100px]"></div>
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="relative z-10 max-w-lg text-center px-12"
         >
            <h2 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-6 leading-tight">"InsightIQ completely changed how we view our monthly sales data."</h2>
            <p className="text-[var(--color-brand-muted)]">— Sarah Jenkins, Founder at RetailWave</p>
         </motion.div>
         {/* Abstract grid */}
         <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--color-brand-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }}></div>
      </div>
    </div>
  );
}
