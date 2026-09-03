import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  className = '',
  disabled = false
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    (opt.value && opt.value.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 bg-[var(--color-brand-bg)] border ${isOpen ? 'border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20' : 'border-[var(--color-brand-border)]'} rounded-xl text-[var(--color-brand-text)] text-sm focus:outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-brand-muted)]'}`}
      >
        <span className={selectedOption ? 'text-[var(--color-brand-text)] truncate' : 'text-[var(--color-brand-muted)]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--color-brand-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-[var(--color-brand-border)] flex items-center gap-2 bg-[var(--color-brand-bg)]/50">
              <Search className="w-4 h-4 text-[var(--color-brand-muted)] ml-2 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent border-none text-[var(--color-brand-text)] text-sm px-2 py-2 focus:outline-none focus:ring-0 placeholder-[var(--color-brand-muted)]"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[var(--color-brand-muted)] text-center">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      value === opt.value
                        ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-medium'
                        : 'text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-bg)] hover:text-[var(--color-brand-text)]'
                    }`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span>{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs opacity-70 mt-0.5">{opt.description}</span>
                      )}
                    </div>
                    {value === opt.value && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
