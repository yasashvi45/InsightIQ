import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = [
  "Technology & Software", "E-commerce & Retail", "Healthcare & Medical", 
  "Financial Services", "Education", "Manufacturing", "Real Estate", 
  "Marketing & Advertising", "Consulting", "Media & Entertainment",
  "Telecommunications", "Transportation & Logistics", "Energy", "Other"
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "France", "Japan", "India", "Brazil", "Mexico", "South Korea", 
  "Italy", "Spain", "Netherlands", "Singapore", "Sweden", "Switzerland"
];

export function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    name: '', businessName: '', email: '', password: '', confirmPassword: '', industry: '', country: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  const navigate = useNavigate();

  // Password strength
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validate = () => {
    setError(null);
    if (!formData.name) return setError('Full Name is required');
    if (!formData.email) return setError('Email is required');
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return setError('Please enter a valid email address');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters long');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (!termsAccepted) return setError('You must agree to the Terms of Service and Privacy Policy');
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validate();
    if (!isValid) return;

    setIsLoading(true);
    try {
      await signup(formData);
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login.');
      } else {
        setError(err.message || 'Signup failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      console.error('Google sign up error:', err);
      console.error('Code:', err.code);
      console.error('Message:', err.message);
      setError(`Google sign up failed: ${err.code || err.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex">
      {/* Left side - Graphic */}
      <div className="hidden lg:flex flex-1 relative bg-[var(--color-brand-card)] border-r border-[var(--color-brand-border)] items-center justify-center overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-brand-secondary)]/10 rounded-full blur-[100px]"></div>
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="relative z-10 max-w-lg text-center px-12"
         >
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-primary)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(18,209,142,0.3)]">
              <Sparkles className="w-8 h-8 text-[var(--color-brand-bg)]" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-6 leading-tight">Start making data-driven decisions today.</h2>
            <p className="text-[var(--color-brand-muted)]">Join thousands of businesses optimizing their growth with AI.</p>
         </motion.div>
         {/* Abstract grid */}
         <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--color-brand-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }}></div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 py-12 relative z-10 overflow-y-auto">
        <Link to="/" className="absolute top-8 right-8 sm:right-12 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none focus:underline">
          Back to Home
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-2 tracking-tight">Create Account</h1>
            <p className="text-[var(--color-brand-muted)]">Set up your InsightIQ workspace.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="John Doe" 
                  className="w-full px-4 py-3 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Name <span className="opacity-50">(Optional)</span></label>
                <input 
                  type="text" 
                  value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  placeholder="Acme Inc." 
                  className="w-full px-4 py-3 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="name@company.com" 
                className="w-full px-4 py-3 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 pr-10 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 pr-10 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div 
                      key={level} 
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        passwordStrength >= level 
                          ? passwordStrength <= 2 ? 'bg-yellow-500' : passwordStrength === 3 ? 'bg-blue-500' : 'bg-[var(--color-brand-primary)]'
                          : 'bg-[var(--color-brand-border)]'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-[var(--color-brand-muted)]">
                  <span>
                    {passwordStrength === 0 ? 'Weak' : passwordStrength <= 2 ? 'Fair' : passwordStrength === 3 ? 'Good' : 'Strong'}
                  </span>
                  <span>Must be at least 8 characters</span>
                </div>
              </div>
            )}

            <div className="flex items-start mt-2">
              <input 
                type="checkbox" 
                id="terms" 
                checked={termsAccepted}
                onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
                className="mt-1 w-4 h-4 rounded border-[var(--color-brand-border)] bg-[var(--color-brand-card)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)] focus:ring-offset-0 cursor-pointer" 
                disabled={isLoading || isGoogleLoading}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-[var(--color-brand-muted)] select-none cursor-pointer">
                I agree to the <a href="#" className="text-[var(--color-brand-primary)] hover:underline focus:outline-none" onClick={e => e.stopPropagation()}>Terms of Service</a> and <a href="#" className="text-[var(--color-brand-primary)] hover:underline focus:outline-none" onClick={e => e.stopPropagation()}>Privacy Policy</a>.
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 mt-4 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_14px_rgba(18,209,142,0.2)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-brand-border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)]">Or sign up with</span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleSignup}
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
            Already have an account? <Link to="/login" className="font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] transition-colors focus:outline-none focus:underline">Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
