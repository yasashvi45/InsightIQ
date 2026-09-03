import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, CheckCircle2, Github, ChevronDown, ChevronUp, Twitter, Linkedin, Activity, Shield, Zap } from 'lucide-react';
import { motion, useScroll, AnimatePresence, useTransform } from 'motion/react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';

function AccordionItem({ q, a, isActive }: { q: string, a: string, isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(isActive);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-card)] shadow-[0_4px_20px_rgba(18,209,142,0.1)]' : 'border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-primary)]/50'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus-visible:outline-none"
      >
        <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-brand-text)]'}`}>{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
          <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-brand-muted)]'}`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 text-[var(--color-brand-muted)] leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple text split for word animation
const AnimatedText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
};

const AnimatedCounter = ({ value }: { value: string }) => {
  const [count, setCount] = useState("0");
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useTransform(
    useScroll({ target: nodeRef, offset: ["start end", "end start"] }).scrollYProgress,
    [0, 1],
    [0, 1]
  );
  
  useEffect(() => {
    // A simple timeout to just set the value after a short delay to simulate counting
    // We could do a full interval based counter, but a simple reveal is often cleaner
    const timer = setTimeout(() => {
      setCount(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  return <span ref={nodeRef}>{count === "0" ? count : value}</span>;
}

export function Landing() {
  const navigate = useNavigate();
    const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-text)] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
          {/* Subtle Grid and Noise Background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full min-w-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] mb-8 hover:border-[var(--color-brand-primary)]/50 transition-colors cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] animate-[pulse_2s_ease-in-out_infinite]"></span>
                <span className="text-xs font-medium text-[var(--color-brand-text)]">InsightIQ v1.0 is now live</span>
                <ArrowRight className="w-3 h-3 text-[var(--color-brand-muted)]" />
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight text-[var(--color-brand-text)] mb-6">
                <AnimatedText text="Turn Business Data Into" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] inline-block"><AnimatedText text="Intelligent Decisions." /></span>
              </h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg text-[var(--color-brand-muted)] mb-10 leading-relaxed max-w-xl"
              >
                The AI Business Intelligence Platform that automatically analyzes your data, detects trends, and generates actionable executive insights in seconds.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-[var(--color-brand-bg)] text-base font-semibold rounded-xl hover:bg-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(18,209,142,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="relative z-10 flex items-center gap-2">Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                </Link>
                <button
                  
                  className="w-full sm:w-auto px-8 py-4 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] border border-[var(--color-brand-border)] text-base font-semibold rounded-xl hover:border-[var(--color-brand-primary)] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1"
                 onClick={() => window.location.href = "/demo"}>
                  View Demo
                </button>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, y: [-15, 15, -15] }}
              transition={{ 
                opacity: { duration: 0.8, ease: "easeOut", delay: 0.4 },
                x: { duration: 0.8, ease: "easeOut", delay: 0.4 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative lg:h-[600px] flex items-center justify-center perspective-[1000px]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-brand-primary)]/20 to-[var(--color-brand-secondary)]/10 rounded-full blur-[100px] opacity-70"></div>
              <motion.div 
                whileHover={{ rotateX: 5, rotateY: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative w-full aspect-[4/3] bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center transform-style-preserve-3d"
              >
                {/* Executive Analytics Dashboard Mockup */}
                <div className="absolute top-0 w-full h-10 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  <div className="ml-4 h-4 w-32 bg-[var(--color-brand-muted)]/20 rounded-md"></div>
                </div>
                <div className="absolute inset-0 pt-10 flex">
                  {/* Left Navigation */}
                  <div className="w-16 md:w-20 border-r border-[var(--color-brand-border)] bg-[var(--color-brand-bg)]/50 p-3 flex flex-col items-center gap-4 hidden sm:flex">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-primary)]/20 mb-4"></div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`w-10 h-10 rounded-lg ${i === 1 ? 'bg-[var(--color-brand-card)] border border-[var(--color-brand-primary)]/30' : 'bg-transparent'} flex items-center justify-center`}>
                        <div className={`w-5 h-5 rounded-md ${i === 1 ? 'bg-[var(--color-brand-primary)]/80' : 'bg-[var(--color-brand-muted)]/30'}`}></div>
                      </div>
                    ))}
                  </div>
                  {/* Dashboard Content */}
                  <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6 bg-gradient-to-br from-[var(--color-brand-bg)] to-[var(--color-brand-card)]">
                    {/* Top Row: KPIs */}
                    <div className="flex gap-4 h-24 md:h-28">
                      {[
                        { color: 'var(--color-brand-primary)', trend: '+12%' },
                        { color: 'var(--color-brand-secondary)', trend: '+8%' },
                        { color: 'rgb(59, 130, 246)', trend: '+24%' }
                      ].map((kpi, i) => (
                        <motion.div 
                          key={i}
                          initial={{ scale: 0.9, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          transition={{ delay: 0.8 + (i * 0.1) }} 
                          className="flex-1 bg-[var(--color-brand-card)] rounded-xl border border-[var(--color-brand-border)] p-3 md:p-4 relative overflow-hidden shadow-md flex flex-col justify-between"
                        >
                           <div className="absolute top-0 right-0 p-3 text-xs font-bold" style={{ color: kpi.color }}>{kpi.trend}</div>
                           <div className="h-3 w-16 md:w-20 bg-[var(--color-brand-muted)]/30 rounded mb-2"></div>
                           <div className="h-6 md:h-8 w-24 md:w-32 bg-white/20 rounded"></div>
                           <div className="absolute bottom-0 left-0 right-0 h-1 opacity-50" style={{ backgroundColor: kpi.color }}></div>
                        </motion.div>
                      ))}
                    </div>
                    {/* Bottom Area: Chart and AI Summary */}
                    <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
                      {/* Main Chart */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        transition={{ delay: 1.2 }} 
                        className="flex-[2] bg-[var(--color-brand-card)] rounded-xl border border-[var(--color-brand-border)] p-4 md:p-5 flex flex-col shadow-md relative"
                      >
                         <div className="flex justify-between items-center mb-4">
                           <div className="h-4 w-32 bg-[var(--color-brand-muted)]/30 rounded"></div>
                           <div className="h-6 w-24 bg-[var(--color-brand-bg)] rounded-full border border-[var(--color-brand-border)]"></div>
                         </div>
                         <div className="flex-1 flex items-end gap-1 md:gap-2">
                           {[20, 35, 25, 50, 45, 70, 60, 85, 75, 100].map((h, i) => (
                             <motion.div 
                               key={i}
                               initial={{ height: 0 }} 
                               animate={{ height: `${h}%` }} 
                               transition={{ delay: 1.3 + (i * 0.05), duration: 0.8, type: "spring" }} 
                               className="flex-1 bg-gradient-to-t from-[var(--color-brand-primary)]/20 to-[var(--color-brand-primary)] rounded-t-sm"
                               style={{ opacity: 0.5 + (i * 0.05) }}
                             ></motion.div>
                           ))}
                         </div>
                      </motion.div>
                      {/* AI Summary Card */}
                      <motion.div 
                        initial={{ x: 20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }} 
                        transition={{ delay: 1.5 }} 
                        className="flex-1 bg-gradient-to-b from-[var(--color-brand-card)] to-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-4 md:p-5 flex flex-col shadow-md relative overflow-hidden"
                      >
                         <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--color-brand-secondary)]/10 rounded-full blur-2xl"></div>
                         <div className="flex items-center gap-2 mb-4">
                           <Sparkles className="w-4 h-4 text-[var(--color-brand-secondary)]" />
                           <div className="h-3 w-20 bg-[var(--color-brand-secondary)]/50 rounded"></div>
                         </div>
                         <div className="space-y-3 flex-1">
                           <div className="h-2 w-full bg-white/20 rounded"></div>
                           <div className="h-2 w-full bg-white/20 rounded"></div>
                           <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                           
                           <div className="mt-4 p-3 bg-[var(--color-brand-bg)] rounded-lg border border-[var(--color-brand-border)] border-l-2 border-l-[var(--color-brand-secondary)]">
                             <div className="h-2 w-full bg-[var(--color-brand-muted)]/40 rounded mb-2"></div>
                             <div className="h-2 w-2/3 bg-[var(--color-brand-muted)]/40 rounded"></div>
                           </div>
                         </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-8 border-y border-[var(--color-brand-border)] bg-[var(--color-brand-card)]/50">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16">
            {['Secure Upload', 'AI Powered', 'Cloud Based', 'Enterprise Ready'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[var(--color-brand-muted)] text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-primary)]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Product Screenshots */}
        <section className="py-24 px-6 overflow-hidden bg-[var(--color-brand-bg)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl lg:text-4xl font-heading font-bold text-[var(--color-brand-text)] mb-6">Designed for clarity. Built for speed.</h2>
               <p className="text-[var(--color-brand-muted)] text-lg">Every pixel is optimized to help you make faster, more accurate business decisions.</p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative rounded-3xl border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] p-2 md:p-4 shadow-2xl overflow-hidden mx-auto max-w-5xl group"
            >
              <div className="absolute top-0 left-0 w-full h-10 md:h-12 bg-[var(--color-brand-bg)] border-b border-[var(--color-brand-border)] flex items-center px-4 gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                <div className="flex-1 flex justify-center opacity-50 text-xs text-[var(--color-brand-muted)] font-mono">app.insightiq.com/workspace</div>
              </div>
              <div className="pt-10 md:pt-12 relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] flex flex-col md:flex-row">
                 {/* Sidebar */}
                 <div className="hidden md:flex w-64 border-r border-[var(--color-brand-border)] bg-[var(--color-brand-card)] flex-col p-4 gap-4 opacity-70">
                    <div className="h-8 w-3/4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg mb-4"></div>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-6 w-full bg-[var(--color-brand-bg)] rounded-md flex items-center px-2 gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[var(--color-brand-muted)]/30"></div>
                        <div className="h-2 w-1/2 bg-[var(--color-brand-muted)]/20 rounded"></div>
                      </div>
                    ))}
                 </div>
                 {/* Main Content: AI Workspace */}
                 <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--color-brand-primary)]/10 blur-3xl rounded-full"></div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-primary)]/20 border border-[var(--color-brand-primary)]/30 flex items-center justify-center">
                         <Sparkles className="w-5 h-5 text-[var(--color-brand-primary)]" />
                      </div>
                      <div>
                        <div className="h-4 w-48 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-[var(--color-brand-muted)]/40 rounded"></div>
                      </div>
                    </div>

                    <div className="flex-1 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-6 flex flex-col relative z-10 shadow-lg">
                      <div className="flex items-center justify-between mb-8">
                         <div className="h-4 w-32 bg-white/10 rounded"></div>
                         <div className="h-6 w-24 bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] text-xs font-semibold flex items-center justify-center rounded-full border border-[var(--color-brand-primary)]/30">Processing</div>
                      </div>

                      <div className="space-y-6">
                        {/* Progress Steps */}
                        {[
                          { label: 'Ingesting dataset.csv (2.4MB)', progress: '100%', active: false },
                          { label: 'Cleaning & normalizing data', progress: '100%', active: false },
                          { label: 'AI identifying correlations', progress: '65%', active: true },
                        ].map((step, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={step.active ? 'text-[var(--color-brand-text)]' : 'text-[var(--color-brand-muted)]'}>{step.label}</span>
                              <span className={step.active ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-brand-muted)]'}>{step.progress}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--color-brand-bg)] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: step.progress }}
                                transition={{ duration: 1.5, delay: i * 0.5 + 0.5 }}
                                className={`h-full ${step.active ? 'bg-[var(--color-brand-primary)] relative' : 'bg-white/20'}`}
                              >
                                {step.active && (
                                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                                )}
                              </motion.div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex gap-4">
                        <div className="h-10 flex-1 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg"></div>
                        <div className="h-10 w-32 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg"></div>
                      </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 relative bg-[var(--color-brand-bg)] overflow-hidden">
           {/* Subtle radial glow for separation */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[var(--color-brand-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-4xl font-heading font-bold text-[var(--color-brand-text)] mb-6 tracking-tight">Beyond Simple Dashboards</h2>
              <p className="text-[var(--color-brand-muted)] text-lg leading-relaxed">We don't just show your data. We understand it, analyze it, and tell you exactly what you need to do next to accelerate growth.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-w-0">
              {[
                { 
                  icon: Activity, 
                  title: 'Automated Analysis', 
                  desc: 'Upload your CSV or connect your DB. We automatically clean, structure, and analyze the data without complex setups.', 
                  color: 'from-blue-500 to-cyan-400', 
                  shadow: 'rgba(59,130,246,0.15)',
                  mockup: (
                    <div className="w-full h-32 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] mb-8 overflow-hidden relative flex flex-col p-3">
                      <div className="flex gap-2 mb-2">
                        <div className="h-2 w-16 bg-blue-500/20 rounded"></div>
                        <div className="h-2 w-12 bg-[var(--color-brand-muted)]/20 rounded"></div>
                      </div>
                      <div className="flex-1 flex items-end gap-1 px-1 pb-1">
                        {[15, 25, 20, 30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 95, 85].map((h, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="flex-1 bg-gradient-to-t from-blue-500/20 to-cyan-400/50 rounded-t-sm"
                          ></motion.div>
                        ))}
                      </div>
                    </div>
                  )
                },
                { 
                  icon: Sparkles, 
                  title: 'AI Generated Insights', 
                  desc: 'Our AI detects hidden patterns, anomalies, and correlations that traditional BI tools completely miss.', 
                  color: 'from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)]', 
                  shadow: 'rgba(18,209,142,0.15)',
                  mockup: (
                    <div className="w-full h-32 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] mb-8 overflow-hidden relative flex flex-col p-3 gap-2 justify-center">
                      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-primary)]/30 rounded-lg p-2 flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 rounded-full bg-[var(--color-brand-primary)]"></div>
                        <div className="space-y-1.5 flex-1">
                          <div className="h-2 w-full bg-[var(--color-brand-text)]/40 rounded"></div>
                          <div className="h-2 w-3/4 bg-[var(--color-brand-muted)]/30 rounded"></div>
                        </div>
                      </div>
                      <div className="bg-[var(--color-brand-card)] border border-red-500/30 rounded-lg p-2 flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="space-y-1.5 flex-1">
                          <div className="h-2 w-5/6 bg-[var(--color-brand-text)]/40 rounded"></div>
                          <div className="h-2 w-1/2 bg-[var(--color-brand-muted)]/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                  )
                },
                { 
                  icon: TrendingUp, 
                  title: 'Predictive Forecasting', 
                  desc: 'Look into the future. Forecast revenue, inventory needs, and growth trajectories with high accuracy.', 
                  color: 'from-purple-500 to-pink-500', 
                  shadow: 'rgba(168,85,247,0.15)',
                  mockup: (
                    <div className="w-full h-32 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] mb-8 overflow-hidden relative p-3">
                      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                          d="M 0 35 Q 15 30 25 25 T 50 20 T 75 10 T 100 5" 
                          fill="none" 
                          stroke="url(#gradient)" 
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Prediction zone highlight */}
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent to-pink-500/10 border-l border-dashed border-pink-500/30"></div>
                    </div>
                  )
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.2, type: "spring", stiffness: 100 }}
                  className="bg-[var(--color-brand-card)] p-8 rounded-3xl border border-[var(--color-brand-border)] transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden flex flex-col items-start"
                  style={{ '--hover-shadow': feature.shadow } as any}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {feature.mockup}

                  <div className={`w-12 h-12 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative`}>
                     <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 rounded-2xl`}></div>
                    <feature.icon className={`w-5 h-5 text-[var(--color-brand-text)]`} />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-4">{feature.title}</h3>
                  <p className="text-[var(--color-brand-muted)] leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Metrics */}
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[var(--color-brand-card)]/50 to-[var(--color-brand-bg)] border-y border-[var(--color-brand-border)]">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center divide-x divide-[var(--color-brand-border)]/50 min-w-0">
               {[
                 { value: '500+', label: 'Enterprise Clients' },
                 { value: '2.4M', label: 'Reports Generated' },
                 { value: '1.2B', label: 'Rows Processed' },
                 { value: '99.8%', label: 'Prediction Accuracy' },
               ].map((metric, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.5, delay: i * 0.15 }}
                   className="space-y-4 px-4 group hover:scale-105 transition-transform duration-300"
                 >
                   <div className="text-5xl md:text-6xl font-heading font-bold text-[var(--color-brand-text)] tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--color-brand-primary)] group-hover:to-[var(--color-brand-secondary)] transition-all duration-300">
                     <AnimatedCounter value={metric.value} />
                   </div>
                   <div className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-[0.2em] group-hover:text-[var(--color-brand-primary)]/80 transition-colors">{metric.label}</div>
                 </motion.div>
               ))}
             </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-32 px-6 bg-[var(--color-brand-bg)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-[var(--color-brand-text)] mb-24">How InsightIQ Works</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative mb-24 min-w-0">
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-[var(--color-brand-card)]">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-[var(--color-brand-primary)] to-purple-500 origin-left"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
              {[
                { step: '01', title: 'Connect Data', desc: 'Securely link your databases, CRM, or upload files directly.', icon: Activity },
                { step: '02', title: 'AI Processing', desc: 'Our models structure and analyze millions of data points instantly.', icon: Zap },
                { step: '03', title: 'Generate Insights', desc: 'Receive actionable recommendations tailored to your goals.', icon: Sparkles },
                { step: '04', title: 'Take Action', desc: 'Implement strategies and track ROI with confidence.', icon: TrendingUp }
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.2, type: "spring", stiffness: 100 }}
                  className="relative z-10 flex flex-col items-center group cursor-default"
                >
                  <div className="w-24 h-24 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center mb-8 shadow-xl group-hover:border-[var(--color-brand-primary)]/50 group-hover:shadow-[0_0_30px_rgba(18,209,142,0.2)] transition-all duration-500 group-hover:scale-110 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-brand-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="text-3xl font-heading font-bold text-[var(--color-brand-text)]/20 absolute group-hover:opacity-0 transition-opacity duration-300">{step.step}</span>
                    <step.icon className="w-8 h-8 text-[var(--color-brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-50 group-hover:scale-100" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-brand-text)] mb-3 group-hover:text-[var(--color-brand-primary)] transition-colors">{step.title}</h3>
                  <p className="text-[var(--color-brand-muted)] text-base leading-relaxed px-4">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Interactive Workflow Visual */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-primary)]/10 blur-[100px] rounded-full"></div>
               
               <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  {/* Upload */}
                  <div className="flex-1 w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl p-6 text-center shadow-lg relative group">
                     <div className="absolute inset-0 border-2 border-dashed border-[var(--color-brand-muted)]/20 rounded-2xl group-hover:border-[var(--color-brand-primary)]/50 transition-colors"></div>
                     <Activity className="w-10 h-10 text-[var(--color-brand-muted)] mx-auto mb-4 group-hover:text-[var(--color-brand-primary)] transition-colors" />
                     <div className="h-3 w-24 bg-[var(--color-brand-muted)]/30 rounded mx-auto mb-2"></div>
                     <div className="h-2 w-16 bg-[var(--color-brand-text)]/20 rounded mx-auto"></div>
                  </div>

                  <ArrowRight className="hidden md:block w-8 h-8 text-[var(--color-brand-muted)] flex-shrink-0 animate-[pulse_2s_ease-in-out_infinite]" />
                  
                  {/* AI Processing */}
                  <div className="flex-[1.5] w-full bg-gradient-to-br from-[var(--color-brand-bg)] to-[var(--color-brand-card)] border border-[var(--color-brand-primary)]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(18,209,142,0.1)] relative">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--color-brand-primary)]/5 blur-xl rounded-full"></div>
                     <div className="flex items-center justify-center gap-4 mb-6">
                        <Sparkles className="w-8 h-8 text-[var(--color-brand-primary)]" />
                        <div className="h-4 w-32 bg-white/20 rounded"></div>
                     </div>
                     <div className="space-y-3">
                       <div className="h-2 w-full bg-[var(--color-brand-muted)]/20 rounded overflow-hidden">
                         <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-1/2 bg-[var(--color-brand-primary)]"></motion.div>
                       </div>
                       <div className="h-2 w-3/4 bg-[var(--color-brand-muted)]/20 rounded overflow-hidden mx-auto">
                         <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.5 }} className="h-full w-1/2 bg-[var(--color-brand-secondary)]"></motion.div>
                       </div>
                     </div>
                  </div>

                  <ArrowRight className="hidden md:block w-8 h-8 text-[var(--color-brand-muted)] flex-shrink-0 animate-[pulse_2s_ease-in-out_infinite]" />
                  
                  {/* Report */}
                  <div className="flex-1 w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl p-6 shadow-lg text-left">
                     <div className="flex gap-2 mb-4">
                       <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                       <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                       <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                     </div>
                     <div className="h-4 w-24 bg-white/20 rounded mb-4"></div>
                     <div className="flex items-end gap-1 mb-4 h-12">
                       <div className="w-1/4 bg-[var(--color-brand-primary)]/30 rounded-t h-[40%]"></div>
                       <div className="w-1/4 bg-[var(--color-brand-primary)]/50 rounded-t h-[70%]"></div>
                       <div className="w-1/4 bg-[var(--color-brand-primary)]/70 rounded-t h-[50%]"></div>
                       <div className="w-1/4 bg-[var(--color-brand-primary)] rounded-t h-[90%]"></div>
                     </div>
                     <div className="h-2 w-full bg-[var(--color-brand-muted)]/20 rounded mb-2"></div>
                     <div className="h-2 w-2/3 bg-[var(--color-brand-muted)]/20 rounded"></div>
                  </div>
               </div>
            </motion.div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-32 px-6 bg-[var(--color-brand-card)]/10 border-y border-[var(--color-brand-border)] relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] mb-6 shadow-sm">
                <span className="flex text-[#FFC857]">
                  {'★★★★★'.split('').map((star, i) => (
                    <motion.span 
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >{star}</motion.span>
                  ))}
                </span>
                <span className="text-sm font-medium text-[var(--color-brand-text)]">Loved by data-driven teams</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-[var(--color-brand-text)] mb-6 tracking-tight">Don't just take our word for it</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-w-0">
              {[
                { quote: "InsightIQ identified a pricing anomaly that saved us $40k in the first month. The setup took less than 5 minutes.", name: "Sarah Jenkins", role: "Founder, RetailWave", logo: "RW", color: "bg-blue-500" },
                { quote: "We used to spend days building reports in Excel. Now, the AI generates executive summaries instantly every morning.", name: "Marcus Chen", role: "COO, Nexus Commerce", logo: "NC", color: "bg-[var(--color-brand-primary)]" },
                { quote: "The forecasting accuracy is unmatched. It predicted our Q4 inventory needs with 98% precision.", name: "Elena Rodriguez", role: "VP of Operations, Nova", logo: "NV", color: "bg-purple-500" }
              ].map((testimonial, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="p-8 md:p-10 rounded-3xl bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex flex-col justify-between hover:border-[var(--color-brand-primary)]/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-8 w-16 h-16 bg-[var(--color-brand-primary)]/5 blur-2xl rounded-full group-hover:bg-[var(--color-brand-primary)]/10 transition-colors"></div>
                  <div className="mb-8 relative">
                    <span className="absolute -top-4 -left-2 text-6xl text-[var(--color-brand-border)]/50 font-serif leading-none">"</span>
                    <p className="text-[var(--color-brand-text)] leading-relaxed relative z-10 text-lg">"{testimonial.quote}"</p>
                  </div>
                  <div className="flex items-center gap-4 pt-6 border-t border-[var(--color-brand-border)]/50">
                    <div className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center font-heading font-bold text-[var(--color-brand-text)] shadow-lg`}>
                      {testimonial.logo}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                        {testimonial.name}
                        <Shield className="w-3 h-3 text-[var(--color-brand-primary)]" />
                      </div>
                      <div className="text-sm text-[var(--color-brand-muted)]">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-32 bg-[var(--color-brand-bg)] border-y border-[var(--color-brand-border)] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-[var(--color-brand-text)] mb-6 tracking-tight">Simple, Transparent Pricing</h2>
              <p className="text-[var(--color-brand-muted)] text-lg">Choose the perfect plan for your business size.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center min-w-0">
              {[
                { name: 'Starter', price: formatCurrency(29), desc: 'Perfect for small shops and freelancers.', features: ['Up to 10k rows/month', 'Basic AI Insights', 'Email Support'], buttonText: 'Start Free Trial' },
                { name: 'Pro', price: formatCurrency(99), desc: 'For growing businesses and e-commerce.', features: ['Up to 1M rows/month', 'Advanced Forecasting', 'Custom Reports', 'Priority Support'], highlighted: true, buttonText: 'Get Started' },
                { name: 'Enterprise', price: 'Custom', desc: 'For large operations requiring scale.', features: ['Unlimited Data', 'Dedicated Account Manager', 'Custom AI Models', 'SLA'], buttonText: 'Contact Sales' }
              ].map((plan, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.15, type: "spring", stiffness: 100 }}
                  className={`flex flex-col p-8 sm:p-10 rounded-3xl border transition-all duration-500 hover:-translate-y-2 min-w-0 w-full box-border ${plan.highlighted ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-card)] shadow-[0_20px_60px_rgba(18,209,142,0.15)] relative lg:scale-105 z-10' : 'border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-[var(--color-brand-primary)]/50'}`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-brand-bg)] px-2">
                      <div className="bg-gradient-to-r from-[var(--color-brand-primary)] to-cyan-400 text-[var(--color-brand-text)] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-[var(--color-brand-primary)]/30 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Most Popular
                      </div>
                    </div>
                  )}
                  <h3 className={`text-2xl font-heading font-semibold mb-2 ${plan.highlighted ? 'text-[var(--color-brand-text)]' : 'text-[var(--color-brand-text)]'}`}>{plan.name}</h3>
                  <p className="text-[var(--color-brand-muted)] text-sm mb-8">{plan.desc}</p>
                  <div className="text-4xl sm:text-5xl font-heading font-bold text-[var(--color-brand-text)] mb-8 tracking-tight break-words truncate max-w-full">{plan.price}<span className="text-lg text-[var(--color-brand-muted)] font-normal">{plan.price !== 'Custom' && '/mo'}</span></div>
                  <ul className="space-y-5 mb-10 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-[var(--color-brand-text)] group">
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-primary)] group-hover:scale-110 transition-transform" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98] ${plan.highlighted ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] hover:bg-[var(--color-brand-secondary)] hover:shadow-[0_8px_25px_rgba(18,209,142,0.4)] hover:-translate-y-1 shadow-[0_4px_15px_rgba(18,209,142,0.2)]' : 'bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-card)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:-translate-y-1'}`}>
                    {plan.buttonText}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section id="faq" className="py-32 px-6 bg-gradient-to-b from-[var(--color-brand-bg)] to-[var(--color-brand-card)]/30 border-y border-[var(--color-brand-border)] relative">
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-[var(--color-brand-text)] mb-6 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-[var(--color-brand-muted)] text-lg">Everything you need to know about the product and billing.</p>
            </div>
            
            <div className="space-y-4">
              {[
                { q: "What data sources do you support?", a: "Currently, we support direct uploads of CSV and Excel files. We are actively working on integrations with Shopify, Stripe, and QuickBooks." },
                { q: "How secure is my business data?", a: "Enterprise-grade security is our priority. Your data is encrypted at rest and in transit. We use SOC2 compliant cloud infrastructure and never train our public models on your proprietary data." },
                { q: "Do I need to be a data scientist to use this?", a: "Not at all. InsightIQ is built specifically for business operators. If you can read a summary email, you can use our platform." },
                { q: "Can I export the reports and insights?", a: "Yes. All reports, charts, and insights can be exported to PDF or CSV with a single click for easy sharing with stakeholders." },
                { q: "How accurate is the AI forecasting?", a: "Our models typically achieve 95-98% accuracy on standard retail and SaaS metrics, depending on the volume and quality of historical data provided." },
                { q: "Can I change my plan later?", a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Upgrades are prorated immediately." }
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <AccordionItem q={faq.q} a={faq.a} isActive={i === 0} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] pt-24 pb-8 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 mb-16 min-w-0 w-full">
            <div className="sm:col-span-1 lg:col-span-4 min-w-0 box-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--color-brand-bg)]" />
                </div>
                <span className="font-heading font-semibold text-xl tracking-tight text-[var(--color-brand-text)]">InsightIQ</span>
              </div>
              <p className="text-[var(--color-brand-muted)] text-sm max-w-sm leading-relaxed mb-8">
                Empowering businesses with AI-driven insights. Stop guessing, start deciding with data you can trust.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] hover:shadow-[0_0_15px_rgba(18,209,142,0.2)] transition-all duration-300 hover:-translate-y-1"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] hover:shadow-[0_0_15px_rgba(18,209,142,0.2)] transition-all duration-300 hover:-translate-y-1"><Linkedin className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] hover:shadow-[0_0_15px_rgba(18,209,142,0.2)] transition-all duration-300 hover:-translate-y-1"><Github className="w-4 h-4" /></a>
              </div>
            </div>
            
            <div className="sm:col-span-1 lg:col-span-2 min-w-0 box-border">
              <h4 className="font-heading font-semibold text-[var(--color-brand-text)] mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-[var(--color-brand-muted)]">
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Features</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Integrations</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Pricing</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Changelog</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Documentation</a></li>
              </ul>
            </div>
            
            <div className="sm:col-span-1 lg:col-span-2 min-w-0 box-border">
              <h4 className="font-heading font-semibold text-[var(--color-brand-text)] mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-[var(--color-brand-muted)]">
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">About Us</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Blog</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Careers</a></li>
                <li><a href="#" className="hover:text-[var(--color-brand-primary)] hover:translate-x-1 inline-block transition-all duration-300">Contact Sales</a></li>
              </ul>
            </div>
            
            <div className="sm:col-span-1 lg:col-span-4 min-w-0 box-border">
              <h4 className="font-heading font-semibold text-[var(--color-brand-text)] mb-6">Subscribe to our newsletter</h4>
              <p className="text-sm text-[var(--color-brand-muted)] mb-4">Get the latest insights on AI and business intelligence.</p>
              <form className="flex flex-col xl:flex-row gap-2 min-w-0 w-full">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors min-w-0 w-full box-border"
                />
                <button type="submit" className="bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[var(--color-brand-secondary)] transition-colors active:scale-95 w-full xl:w-auto whitespace-nowrap">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="pt-8 border-t border-[var(--color-brand-border)] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--color-brand-muted)] flex-wrap">
            <p>© 2026 InsightIQ Inc. All rights reserved.</p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
              <a href="#" className="hover:text-[var(--color-brand-primary)] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[var(--color-brand-primary)] transition-colors">Terms of Service</a>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1">Back to top <ChevronUp className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
