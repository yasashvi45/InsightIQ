import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function NotFound() {
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
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center relative">
             <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping"></div>
             <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-8xl font-heading font-bold text-[var(--color-brand-text)] mb-4 tracking-tight drop-shadow-2xl">404</h1>
        <h2 className="text-2xl font-heading font-semibold text-[var(--color-brand-text)] mb-4">Page Not Found</h2>
        
        <p className="text-[var(--color-brand-muted)] mb-10 max-w-sm mx-auto leading-relaxed">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-bold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_20px_rgba(18,209,142,0.3)] hover:shadow-[0_4px_25px_rgba(18,209,142,0.5)] active:scale-[0.98] group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Homepage
        </Link>
      </motion.div>
    </div>
  );
}
