import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, FileText, BarChart2, MessageSquare, Settings, CornerDownLeft, Database, Activity, Sparkles, TrendingUp, Package, Box, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { computeMetrics, formatNumber } from '../lib/dataUtils';

export function GlobalSearch({ isMobileButton = false }: { isMobileButton?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { datasets, activeDataset, reports, setActiveDataset } = useData();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const metrics = useMemo(() => {
    if (!activeDataset) return null;
    return computeMetrics(activeDataset);
  }, [activeDataset]);

  const allResults = useMemo(() => {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase().trim();

    const pages = [
      { type: 'Page', title: 'Dashboard', icon: BarChart2, path: '/dashboard', group: 'Pages' },
      { type: 'Page', title: 'Analytics', icon: Activity, path: '/analytics', group: 'Pages' },
      { type: 'Page', title: 'Forecast', icon: TrendingUp, path: '/forecast', group: 'Pages' },
      { type: 'Page', title: 'AI Insights', icon: Sparkles, path: '/insights', group: 'Pages' },
      { type: 'Page', title: 'Reports', icon: FileText, path: '/reports', group: 'Pages' },
      { type: 'Page', title: 'AI Assistant', icon: MessageSquare, path: '/assistant', group: 'Pages' },
      { type: 'Page', title: 'Settings', icon: Settings, path: '/settings', group: 'Pages' },
    ];

    if (!lowerQuery) {
      results.push(...pages.slice(0, 6));
    } else {
      const pageMatches = pages.filter(p => p.title.toLowerCase().includes(lowerQuery) || p.path.toLowerCase().includes(lowerQuery));
      if (pageMatches.length > 0) results.push(...pageMatches);

      const matchedDatasets = datasets.filter(d => d.name.toLowerCase().includes(lowerQuery));
      if (matchedDatasets.length > 0) {
        results.push(...matchedDatasets.map(d => ({
          type: 'Dataset',
          title: d.name,
          subtitle: `${d.data?.length || 0} rows`,
          icon: Database,
          action: () => navigate('/dashboard'),
          datasetId: d.id,
          group: 'Datasets'
        })));
      }

      const matchedReports = reports.filter(r => r.name.toLowerCase().includes(lowerQuery) || r.type.toLowerCase().includes(lowerQuery));
      if (matchedReports.length > 0) {
        results.push(...matchedReports.map(r => ({
          type: 'Report',
          title: r.name,
          subtitle: r.type,
          icon: FileText,
          action: () => navigate('/reports'),
          group: 'Reports'
        })));
      }

      if (activeDataset && metrics) {
         if ('revenue'.includes(lowerQuery) || 'sales'.includes(lowerQuery) || 'total'.includes(lowerQuery)) {
            if (metrics.totalRevenue > 0) {
               results.push({ type: 'Metric', title: 'Total Revenue', subtitle: `${formatNumber(metrics.totalRevenue)}`, icon: TrendingUp, action: () => navigate('/dashboard'), group: 'Metrics' });
            }
            if (metrics.totalSales > 0) {
               results.push({ type: 'Metric', title: 'Total Sales (Orders)', subtitle: formatNumber(metrics.totalSales), icon: Activity, action: () => navigate('/analytics'), group: 'Metrics' });
            }
         }
         
         if ('customers'.includes(lowerQuery) || 'users'.includes(lowerQuery)) {
            if (metrics.totalCustomers > 0) {
               results.push({ type: 'Metric', title: 'Total Customers', subtitle: formatNumber(metrics.totalCustomers), icon: Users, action: () => navigate('/analytics'), group: 'Metrics' });
            }
         }

         if ('average'.includes(lowerQuery) || 'order value'.includes(lowerQuery) || 'aov'.includes(lowerQuery)) {
            if (metrics.totalRevenue > 0 && metrics.totalSales > 0) {
               results.push({ type: 'Metric', title: 'Average Order Value', subtitle: `${formatNumber(metrics.totalRevenue / metrics.totalSales)}`, icon: Activity, action: () => navigate('/analytics'), group: 'Metrics' });
            }
         }

         if ('business health'.includes(lowerQuery) || 'health'.includes(lowerQuery) || 'score'.includes(lowerQuery)) {
            if (metrics.healthScore > 0) {
               results.push({ type: 'Metric', title: 'Business Health Score', subtitle: `${metrics.healthScore}/100`, icon: Activity, action: () => navigate('/dashboard'), group: 'Metrics' });
            }
         }

         if ('forecast'.includes(lowerQuery) || 'predict'.includes(lowerQuery) || 'future'.includes(lowerQuery)) {
            results.push({ type: 'Forecast', title: 'Revenue Forecast', subtitle: 'AI predicted revenue trajectory', icon: TrendingUp, action: () => navigate('/forecast'), group: 'Forecast' });
         }

         if (metrics.topProducts && metrics.topProducts.length > 0) {
            const matchedProducts = metrics.topProducts.filter((p: any) => p.name.toLowerCase().includes(lowerQuery));
            if (matchedProducts.length > 0) {
               results.push(...matchedProducts.map((p: any) => ({ type: 'Product', title: p.name, subtitle: p.value ? `Sales: ${formatNumber(p.value)}` : 'Top Product', icon: Package, action: () => navigate('/analytics'), group: 'Products' })));
            }
         }

         if (metrics.categoryData && metrics.categoryData.length > 0) {
            const matchedCategories = metrics.categoryData.filter((c: any) => c.name.toLowerCase().includes(lowerQuery));
            if (matchedCategories.length > 0) {
               results.push(...matchedCategories.map((c: any) => ({ type: 'Category', title: c.name, subtitle: c.value ? `Value: ${formatNumber(c.value)}` : 'Category', icon: Box, action: () => navigate('/analytics'), group: 'Categories' })));
            }
         }

         if (metrics.aiInsights && Array.isArray(metrics.aiInsights.list)) {
           const insights = metrics.aiInsights.list;
           const matchedInsights = insights.filter((i: any) => (i.title && i.title.toLowerCase().includes(lowerQuery)) || (i.description && i.description.toLowerCase().includes(lowerQuery)));
           if (matchedInsights.length > 0) {
              results.push(...matchedInsights.slice(0, 3).map((i: any) => ({ type: 'Insight', title: i.title.length > 40 ? i.title.substring(0, 40) + '...' : i.title, subtitle: i.type || 'AI Analysis', icon: Sparkles, action: () => navigate('/insights'), group: 'Insights' })));
           }
         }

         if (lowerQuery.length > 2 && activeDataset.data && activeDataset.data.length > 0) {
            const stringCols = activeDataset.columns.filter((c: any) => c.type === 'string' || typeof c === 'string').map((c: any) => typeof c === 'string' ? c : c.name);
            let matchesFound = 0;
            const seen = new Set();
            const limit = Math.min(activeDataset.data.length, 1000);
            for (let i = 0; i < limit && matchesFound < 5; i++) {
               const row = activeDataset.data[i];
               for (const col of stringCols) {
                  const val = row[col];
                  if (val && typeof val === 'string' && val.toLowerCase().includes(lowerQuery)) {
                     if (!seen.has(val)) {
                        seen.add(val);
                        matchesFound++;
                        results.push({ type: 'Data Record', title: val, subtitle: `in ${col}`, icon: Box, action: () => navigate('/dashboard'), group: 'Data' });
                     }
                  }
               }
            }
         }
      }
    }
    return results;
  }, [query, datasets, reports, activeDataset, metrics, navigate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (selectedIndex + 1) % allResults.length;
      setSelectedIndex(nextIndex);
      scrollToIndex(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (selectedIndex - 1 + allResults.length) % allResults.length;
      setSelectedIndex(prevIndex);
      scrollToIndex(prevIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults.length > 0 && allResults[selectedIndex]) {
        executeResult(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const scrollToIndex = (index: number) => {
    if (!listRef.current) return;
    const elements = listRef.current.querySelectorAll('[data-search-item]');
    if (elements[index]) {
       (elements[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  const executeResult = (result: any) => {
     if (result.path) {
        navigate(result.path);
     } else if (result.action) {
        if (result.datasetId) {
           setActiveDataset(result.datasetId);
        }
        result.action();
     }
     setIsOpen(false);
     inputRef.current?.blur();
  };

  const groupedResults = allResults.reduce((acc, curr) => {
    const group = curr.group || 'Results';
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, typeof allResults>);

  const groups = Object.keys(groupedResults);
  let globalIndex = 0;

  const PanelContent = () => (
    <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
      {isMobileButton && (
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-brand-border)] shrink-0 md:hidden">
          <Search className="w-5 h-5 text-[var(--color-brand-muted)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, datasets, reports, metrics..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--color-brand-text)] text-base placeholder-[var(--color-brand-muted)]"
          />
        </div>
      )}
      
      <div className="overflow-y-auto p-2 custom-scrollbar max-h-[60vh] md:max-h-[350px]" ref={listRef}>
        {allResults.length > 0 ? (
          <div className="space-y-4 pb-2">
            {groups.map(groupName => {
               const items = groupedResults[groupName];
               return (
                 <div key={groupName} className="space-y-1">
                   <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">
                     {!query && groupName === 'Pages' ? 'Quick Navigation' : groupName}
                   </div>
                   {items.map((result) => {
                     const currentIndex = globalIndex++;
                     const isSelected = selectedIndex === currentIndex;
                     return (
                       <button
                         key={currentIndex}
                         data-search-item
                         onClick={() => executeResult(result)}
                         onMouseEnter={() => setSelectedIndex(currentIndex)}
                         className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors group text-left ${isSelected ? 'bg-[var(--color-brand-bg)] border border-[var(--color-brand-primary)]/20' : 'hover:bg-[var(--color-brand-bg)] border border-transparent'}`}
                       >
                         <div className="flex items-center gap-3 min-w-0">
                           <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[var(--color-brand-bg)] border-[var(--color-brand-primary)]/30' : 'bg-[var(--color-brand-bg)] border-[var(--color-brand-border)]'}`}>
                             <result.icon className={`w-4 h-4 transition-colors ${isSelected ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)]'}`} />
                           </div>
                           <div className="min-w-0 truncate pr-4">
                             <h4 className={`text-sm font-medium transition-colors truncate ${isSelected ? 'text-[var(--color-brand-text)]' : 'text-[var(--color-brand-text)]'}`}>{result.title}</h4>
                             {result.subtitle ? (
                               <p className="text-xs text-[var(--color-brand-muted)] truncate">{result.subtitle}</p>
                             ) : (
                               <p className="text-xs text-[var(--color-brand-muted)] truncate">{result.type}</p>
                             )}
                           </div>
                         </div>
                         <CornerDownLeft className={`w-4 h-4 shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-[var(--color-brand-primary)]' : 'opacity-0 text-[var(--color-brand-muted)] group-hover:opacity-100'}`} />
                       </button>
                     );
                   })}
                 </div>
               );
            })}
          </div>
        ) : (
           <div className="py-10 text-center text-[var(--color-brand-muted)]">
             <p className="text-[14px] font-medium text-[var(--color-brand-text)] mb-2">No results found</p>
             <p className="text-xs mb-4">Try searching for:</p>
             <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
               {['Revenue', 'Products', 'Customers', 'Forecast', 'Reports'].map(term => (
                  <button 
                    key={term}
                    onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-xs text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
                  >
                    {term}
                  </button>
               ))}
             </div>
           </div>
        )}
      </div>

      <div className="p-2.5 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] flex flex-wrap items-center gap-4 text-[10px] md:text-xs text-[var(--color-brand-muted)] shrink-0">
        <span className="flex items-center gap-1.5"><Command className="w-3 h-3" /> or Ctrl + K to open</span>
        <span className="flex items-center gap-1.5 hidden sm:flex"><span className="border border-[var(--color-brand-border)] rounded px-1 flex flex-col justify-center leading-none text-[8px] py-0.5">▲<br/>▼</span> Navigate</span>
        <span className="flex items-center gap-1.5"><CornerDownLeft className="w-3 h-3" /> Select</span>
      </div>
    </div>
  );

  if (isMobileButton) {
    return (
      <>
        <button 
          className="md:hidden p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors rounded-lg hover:bg-[var(--color-brand-card)]"
          onClick={() => setIsOpen(true)}
        >
          <Search className="w-5 h-5" />
        </button>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[5vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none md:hidden">
            <div ref={containerRef} className="w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <PanelContent />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop inline input
  return (
    <div className="relative group flex-1 hidden md:block min-w-0" ref={containerRef}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-[var(--color-brand-muted)] group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder="Search metrics, reports, or ask AI (Ctrl+K)..."
        className="flex items-center w-full pl-10 pr-4 py-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-lg text-sm text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all min-w-0"
      />
      {isOpen && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 w-[min(600px,calc(100vw-32px))] z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
          <PanelContent />
        </div>
      )}
    </div>
  );
}
