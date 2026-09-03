import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If we are not on the landing page, we should ideally navigate to /#id
      // For now, this is just for the landing page
      window.location.href = `/#${id}`;
    }
  };

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--color-brand-bg)]/80 backdrop-blur-md border-b border-[var(--color-brand-border)] shadow-lg shadow-black/20 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center shadow-[0_0_15px_rgba(18,209,142,0.3)]">
              <Sparkles className="w-5 h-5 text-[var(--color-brand-bg)]" />
            </div>
            <Link to="/" className="font-heading font-semibold text-xl tracking-tight text-[var(--color-brand-text)]">InsightIQ</Link>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-[var(--color-brand-muted)]">
            {['features', 'how-it-works', 'pricing', 'faq'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollTo(item)} 
                className="relative hover:text-[var(--color-brand-text)] transition-colors group capitalize"
              >
                {item.replace(/-/g, ' ')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-brand-primary)] transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">Login</Link>
            <Link to="/signup" className="px-5 py-2.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-sm font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(18,209,142,0.3)] hover:scale-[1.02] active:scale-[0.98]">
              Get Started
            </Link>
          </div>

          <button 
            className="lg:hidden p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[var(--color-brand-bg)] pt-24 px-6 lg:hidden"
          >
            <div className="flex flex-col gap-6 text-lg font-medium">
              {['features', 'how-it-works', 'pricing', 'faq'].map((item) => (
                <button key={item} onClick={() => scrollTo(item)} className="text-left capitalize text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]">
                  {item.replace(/-/g, ' ')}
                </button>
              ))}
              <hr className="border-[var(--color-brand-border)]" />
              <Link to="/login" className="text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="w-full py-4 text-center bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl block" onClick={() => setIsMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
