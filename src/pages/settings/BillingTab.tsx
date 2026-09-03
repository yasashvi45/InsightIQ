import  { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Download, Zap, Database, Activity, Package } from 'lucide-react';
import { toast } from 'sonner';

import { useCurrency } from '../../hooks/useCurrency';

export function BillingTab() {
    const { formatCurrency } = useCurrency();

  const PLANS = [
    { id: 'free', name: 'Free', price: formatCurrency(0), desc: 'For individuals', current: false },
    { id: 'starter', name: 'Starter', price: formatCurrency(49), desc: 'For small teams', current: false },
    { id: 'professional', name: 'Professional', price: formatCurrency(99), desc: 'For growing businesses', current: true },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'For large organizations', current: false },
  ];

  const INVOICES = [
    { id: 'INV-2023-001', date: '2023-10-01', amount: formatCurrency(99), status: 'Paid' },
    { id: 'INV-2023-002', date: '2023-09-01', amount: formatCurrency(99), status: 'Paid' },
    { id: 'INV-2023-003', date: '2023-08-01', amount: formatCurrency(99), status: 'Paid' },
  ];

  const handleAction = async (action: string) => {
    toast.info(`${action} is currently in Demo Mode. Real payments coming soon.`);
  };

  const handleDownload = (id: string) => {
    toast.info(`Invoice downloads are disabled in Demo Mode.`);
  };

  return (
    <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1 flex items-center gap-3">
            Billing & Subscription 
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]">Demo Mode</span>
          </h2>
          <p className="text-sm text-[var(--color-brand-muted)]">Manage your plan, usage, and payments.</p>
        </div>
      </div>

      {/* Current Plan Overview */}
      <div className="bg-gradient-to-br from-[var(--color-brand-bg)] to-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Package className="w-32 h-32 text-[var(--color-brand-text)]" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-start mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-[var(--color-brand-text)]">Professional Plan</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20">
                Active
              </span>
            </div>
            <p className="text-sm text-[var(--color-brand-muted)]">Your next billing date is Nov 1, 2023 ({formatCurrency(99)})</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleAction('Manage Billing')}
              className="px-4 py-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] hover:bg-[var(--color-brand-border)] rounded-lg text-sm font-medium transition-colors"
            >
              Manage Billing
            </button>
            <button 
              onClick={() => handleAction('Upgrade Plan')}
              className="px-4 py-2 bg-white text-black hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {[
            { label: 'Storage Used', val: '45 GB', max: '100 GB', icon: Database, percent: 45 },
            { label: 'AI Credits', val: '8,230', max: '10,000', icon: Zap, percent: 82 },
            { label: 'Datasets', val: '24', max: '50', icon: Package, percent: 48 },
            { label: 'API Calls', val: '1.2M', max: '2M', icon: Activity, percent: 60 }
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--color-brand-bg)]/50 backdrop-blur border border-[var(--color-brand-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="w-4 h-4 text-[var(--color-brand-muted)]" />
                <span className="text-sm font-medium text-[var(--color-brand-text)]">{stat.label}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-brand-text)] font-semibold">{stat.val}</span>
                <span className="text-[var(--color-brand-muted)]">{stat.max}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-brand-border)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${stat.percent > 80 ? 'bg-red-500' : 'bg-[var(--color-brand-primary)]'}`} 
                  style={{ width: `${stat.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-brand-text)] mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-5 flex items-center justify-between group hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-blue-800 font-bold italic">VISA</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-brand-text)]">•••• •••• •••• 2345</p>
                <p className="text-xs text-[var(--color-brand-muted)]">Expires 12/25 &bull; Default</p>
              </div>
            </div>
            <span className="text-xs font-medium text-[var(--color-brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
          </div>
          <button 
            onClick={() => handleAction('Add Payment Method')}
            className="bg-[var(--color-brand-card)] border border-dashed border-[var(--color-brand-border)] hover:border-[var(--color-brand-muted)] rounded-xl p-5 flex items-center justify-center gap-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium">Add Payment Method</span>
          </button>
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-brand-text)] mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className={`bg-[var(--color-brand-bg)] border ${plan.current ? 'border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]' : 'border-[var(--color-brand-border)]'} rounded-2xl p-5 flex flex-col h-full relative overflow-hidden`}>
              {plan.current && (
                 <div className="absolute top-0 right-0 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                   Current
                 </div>
              )}
              <h4 className="font-semibold text-[var(--color-brand-text)] mb-1">{plan.name}</h4>
              <p className="text-xs text-[var(--color-brand-muted)] mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-[var(--color-brand-text)]">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-sm text-[var(--color-brand-muted)]">/mo</span>}
              </div>
              <button 
                onClick={() => handleAction('Change Plan')}
                disabled={plan.current}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors mt-auto ${
                  plan.current 
                    ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] cursor-default' 
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {plan.current ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Billing History</h3>
          <button className="text-sm text-[var(--color-brand-primary)] hover:underline">View All</button>
        </div>
        <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] border-b border-[var(--color-brand-border)]">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-brand-border)]">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--color-brand-card)]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--color-brand-text)]">{inv.id}</td>
                  <td className="px-4 py-3 text-[var(--color-brand-muted)]">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[var(--color-brand-text)]">{inv.amount}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDownload(inv.id)} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] rounded-md hover:bg-[var(--color-brand-border)] transition-colors inline-flex">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
}
