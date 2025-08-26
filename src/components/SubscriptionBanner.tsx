import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionBannerProps {
  taskCount: number;
  onUpgradeClick: () => void;
}

export function SubscriptionBanner({ taskCount, onUpgradeClick }: SubscriptionBannerProps) {
  const { getFeatureLimits, isWithinLimits, isPremium } = useSubscription();
  const limits = getFeatureLimits();
  
  // Don't show banner for premium users
  if (isPremium) return null;
  
  const isNearLimit = !isWithinLimits(taskCount, 'maxTasks');
  const remainingTasks = Math.max(0, (limits.maxTasks as number) - taskCount);
  const usagePercent = Math.min(100, (taskCount / (limits.maxTasks as number)) * 100);

  return (
    <div className={`card-elevated p-4 mb-6 border-l-4 ${
      isNearLimit 
        ? 'border-l-error-40 bg-error-40/5 dark:bg-error-40/10' 
        : usagePercent > 70
        ? 'border-l-tertiary-40 bg-tertiary-40/5 dark:bg-tertiary-40/10'
        : 'border-l-primary-40 bg-primary-40/5 dark:bg-primary-40/10'
    } animate-slide-up`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">
              {isNearLimit ? '⚠️' : usagePercent > 70 ? '📊' : '✨'}
            </span>
            <h3 className="text-title-medium font-medium text-on-surface dark:text-white">
              {isNearLimit 
                ? 'Task Limit Reached!' 
                : `Free Plan - ${remainingTasks} tasks remaining`
              }
            </h3>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center justify-between text-body-small text-on-surface-variant dark:text-gray-300 mb-1">
              <span>{taskCount} / {limits.maxTasks} tasks used</span>
              <span>{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-outline-variant/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isNearLimit
                    ? 'bg-error-40'
                    : usagePercent > 70
                    ? 'bg-tertiary-40'
                    : 'bg-primary-40 dark:bg-accent-dark-gold'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-body-small text-on-surface-variant dark:text-gray-400">
            {isNearLimit 
              ? 'Upgrade to Pro for unlimited tasks and premium features!'
              : 'Upgrade to unlock unlimited tasks, advanced analytics, and premium voice AI.'
            }
          </p>
        </div>

        <button
          onClick={onUpgradeClick}
          className={`ml-4 px-6 py-2 rounded-full font-medium text-label-medium transition-all duration-200 ${
            isNearLimit
              ? 'bg-error-40 text-white hover:bg-error-40/90 shadow-elevation-2'
              : 'bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black hover:bg-primary-40/90 dark:hover:bg-accent-dark-gold/90 shadow-elevation-2 hover:shadow-elevation-3'
          }`}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}