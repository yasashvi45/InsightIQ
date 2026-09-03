import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simple mock function, usually you'd verify a token here
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 group z-10">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(18,209,142,0.4)] transition-all">
          <Sparkles className="w-5 h-5 text-[var(--color-brand-bg)]" />
        </div>
        <span className="font-heading font-semibold text-xl tracking-tight text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">InsightIQ</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 shadow-2xl z-10"
      >
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--color-brand-text)] mb-2">Create New Password</h1>
              <p className="text-[var(--color-brand-muted)] text-sm mb-8 leading-relaxed">Your new password must be different from previous used passwords.</p>
              
              <form onSubmit={handleReset} className="space-y-5">
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
                  <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-10 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                      disabled={isLoading}
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-10 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3 mt-2 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_14px_rgba(18,209,142,0.2)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[var(--color-brand-primary)]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--color-brand-text)] mb-4">Password Reset</h1>
              <p className="text-[var(--color-brand-muted)] text-sm mb-8 leading-relaxed">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              
              <Link 
                to="/login"
                className="w-full py-3 flex items-center justify-center bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_14px_rgba(18,209,142,0.2)] active:scale-[0.98]"
              >
                Continue to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSuccess && (
          <div className="mt-8 pt-6 border-t border-[var(--color-brand-border)] text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
