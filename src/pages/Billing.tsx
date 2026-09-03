import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BillingTab } from './settings/BillingTab';

export function Billing() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Billing & Plan</h1>
        <p className="text-[var(--color-brand-muted)] text-sm">Manage your subscription, usage, and payment details.</p>
      </div>

      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 sm:p-8 shadow-sm">
        <BillingTab />
      </div>
    </div>
  );
}
