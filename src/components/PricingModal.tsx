import { useState } from 'react';
import { PRICING_PLANS, PricingPlan } from '../lib/stripe';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
  currentPlan?: string;
}

export function PricingModal({ isOpen, onClose, onSelectPlan, currentPlan }: PricingModalProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  if (!isOpen) return null;

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Handle free plan selection (no payment needed)
      onSelectPlan(plan);
    } else {
      // Handle paid plan selection
      onSelectPlan(plan);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="card-elevated max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <div></div>
              <h2 className="text-headline-large font-normal text-on-surface dark:text-white">
                Choose Your Plan
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-on-surface/8 dark:hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl text-on-surface-variant dark:text-gray-400">×</span>
              </button>
            </div>
            <p className="text-body-large text-on-surface-variant dark:text-gray-300">
              Unlock the full potential of your productivity
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="surface-container dark:bg-surface-dark-container rounded-full p-1 flex">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-6 py-2 rounded-full text-label-large font-medium transition-all duration-200 ${
                  billingInterval === 'month'
                    ? 'bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black shadow-elevation-2'
                    : 'text-on-surface-variant dark:text-gray-300 hover:bg-on-surface/8 dark:hover:bg-white/10'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-6 py-2 rounded-full text-label-large font-medium transition-all duration-200 relative ${
                  billingInterval === 'year'
                    ? 'bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black shadow-elevation-2'
                    : 'text-on-surface-variant dark:text-gray-300 hover:bg-on-surface/8 dark:hover:bg-white/10'
                }`}
              >
                Yearly
                <span className="absolute -top-1 -right-1 bg-accent-dark-coral text-white text-xs px-1.5 py-0.5 rounded-full">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {PRICING_PLANS.map((plan, index) => {
              const price = billingInterval === 'year' && plan.price > 0 
                ? plan.price * 12 * 0.8 // 20% discount for yearly
                : plan.price;
              
              const isCurrentPlan = currentPlan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-elevation-3 ${
                    plan.popular
                      ? 'border-primary-40 dark:border-accent-dark-gold bg-primary-40/5 dark:bg-accent-dark-gold/10 scale-105'
                      : isCurrentPlan
                      ? 'border-accent-dark-emerald bg-accent-dark-emerald/5'
                      : 'border-outline-variant dark:border-gray-600 bg-surface-light-container dark:bg-surface-dark-container hover:border-primary-40/50 dark:hover:border-accent-dark-gold/50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black px-4 py-1 rounded-full text-label-small font-medium">
                      Most Popular
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 bg-accent-dark-emerald text-white px-3 py-1 rounded-full text-label-small font-medium">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-title-large font-medium text-on-surface dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-display-medium font-normal text-primary-40 dark:text-accent-dark-gold">
                        ${billingInterval === 'year' && plan.price > 0 ? (price / 12).toFixed(2) : price.toFixed(2)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-body-medium text-on-surface-variant dark:text-gray-400">
                          /{billingInterval === 'year' ? 'mo' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingInterval === 'year' && plan.price > 0 && (
                      <div className="text-body-small text-accent-dark-emerald">
                        Save ${(plan.price * 12 * 0.2).toFixed(0)} per year
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-accent-dark-emerald text-lg mt-0.5">✓</span>
                        <span className="text-body-medium text-on-surface dark:text-gray-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-full font-medium text-label-large transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-surface-light-container dark:bg-surface-dark-container-high text-on-surface-variant dark:text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black hover:bg-primary-40/90 dark:hover:bg-accent-dark-gold/90 shadow-elevation-2 hover:shadow-elevation-3'
                        : 'bg-transparent border-2 border-primary-40 dark:border-accent-dark-gold text-primary-40 dark:text-accent-dark-gold hover:bg-primary-40/10 dark:hover:bg-accent-dark-gold/10'
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : plan.id === 'free'
                      ? 'Get Started Free'
                      : `Upgrade to ${plan.name}`
                    }
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center text-body-small text-on-surface-variant dark:text-gray-400">
            <p className="mb-2">
              🔒 Secure payment processing powered by Stripe
            </p>
            <p>
              ✨ Cancel anytime • 💰 30-day money-back guarantee • 🌍 Available worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}