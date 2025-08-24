import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey || '');
  }
  return stripePromise;
};

// Check if Stripe is configured
export const isStripeConfigured = Boolean(
  stripePublishableKey && 
  stripePublishableKey !== 'your-stripe-publishable-key-here' &&
  stripePublishableKey.startsWith('pk_')
);

// Pricing plans
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Up to 50 tasks',
      'Basic calendar views',
      'Simple voice commands',
      'Export to JSON',
      'Light & dark themes'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      'Unlimited tasks',
      'Advanced analytics',
      'Premium voice AI',
      'All export formats',
      'Priority support',
      'Custom templates'
    ],
    popular: true,
    stripePriceId: 'price_pro_monthly' // You'll get this from Stripe dashboard
  },
  {
    id: 'team',
    name: 'Team',
    price: 19.99,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced integrations',
      'Custom branding',
      'Admin dashboard',
      'Priority phone support'
    ],
    stripePriceId: 'price_team_monthly'
  }
];

// User subscription status
export interface UserSubscription {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Feature limits for different plans
export const FEATURE_LIMITS = {
  free: {
    maxTasks: 50,
    maxTemplates: 3,
    advancedAnalytics: false,
    premiumVoice: false,
    exportFormats: ['json'],
    prioritySupport: false
  },
  pro: {
    maxTasks: Infinity,
    maxTemplates: Infinity,
    advancedAnalytics: true,
    premiumVoice: true,
    exportFormats: ['json', 'csv', 'ical'],
    prioritySupport: true
  },
  team: {
    maxTasks: Infinity,
    maxTemplates: Infinity,
    advancedAnalytics: true,
    premiumVoice: true,
    exportFormats: ['json', 'csv', 'ical'],
    prioritySupport: true,
    teamFeatures: true,
    customBranding: true
  }
};

export default getStripe;