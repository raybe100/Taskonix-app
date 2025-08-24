import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { UserSubscription, FEATURE_LIMITS } from '../lib/stripe';

export function useSubscription() {
  const { user, isSignedIn } = useUser();
  
  const [subscription, setSubscription] = useState<UserSubscription | null>(() => {
    // For demo purposes, start with a free plan
    const stored = localStorage.getItem(`user-subscription-${user?.id || 'anonymous'}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        currentPeriodEnd: new Date(parsed.currentPeriodEnd)
      };
    }
    return {
      id: 'demo-free',
      plan: 'free',
      status: 'active' as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false
    };
  });

  const [loading, setLoading] = useState(false);

  // Save subscription to localStorage with user ID (in a real app, this would sync with your backend)
  useEffect(() => {
    if (subscription && user?.id) {
      localStorage.setItem(`user-subscription-${user.id}`, JSON.stringify(subscription));
    }
  }, [subscription, user?.id]);

  const upgradeToPlan = async (planId: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would:
      // 1. Call your backend to create/update the subscription
      // 2. Handle the Stripe checkout session
      // 3. Update the user's subscription status
      
      setSubscription({
        id: `demo-${planId}`,
        plan: planId,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      });

      return true;
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!subscription || subscription.plan === 'free') return false;

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true
      } : null);

      return true;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async (): Promise<boolean> => {
    if (!subscription) return false;

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: false
      } : null);

      return true;
    } catch (error) {
      console.error('Subscription reactivation failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get feature limits for current plan
  const getFeatureLimits = () => {
    if (!subscription) return FEATURE_LIMITS.free;
    return FEATURE_LIMITS[subscription.plan as keyof typeof FEATURE_LIMITS] || FEATURE_LIMITS.free;
  };

  // Check if user has access to a specific feature
  const hasFeatureAccess = (feature: keyof typeof FEATURE_LIMITS.free): boolean => {
    const limits = getFeatureLimits();
    return limits[feature] as boolean;
  };

  // Check if user is within usage limits
  const isWithinLimits = (currentUsage: number, limitType: keyof typeof FEATURE_LIMITS.free): boolean => {
    const limits = getFeatureLimits();
    const limit = limits[limitType];
    return typeof limit === 'number' ? currentUsage < limit : true;
  };

  return {
    subscription,
    loading,
    upgradeToPlan,
    cancelSubscription,
    reactivateSubscription,
    getFeatureLimits,
    hasFeatureAccess,
    isWithinLimits,
    isPremium: subscription?.plan !== 'free',
    isActive: subscription?.status === 'active'
  };
}