import React from 'react';
import { cn } from '../../lib/utils';

interface PricingToggleProps {
  billingCycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
}

const PricingToggle = ({ billingCycle, onChange }: PricingToggleProps) => {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="rounded-full bg-gray-100 p-1 flex">
        <button
          onClick={() => onChange('monthly')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full transition-all",
            billingCycle === 'monthly'
              ? "bg-primary-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange('yearly')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full transition-all relative",
            billingCycle === 'yearly'
              ? "bg-primary-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Yearly
          {billingCycle === 'yearly' && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PricingToggle;