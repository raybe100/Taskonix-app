import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import getStripe from '../lib/stripe';

interface PaymentFormProps {
  plan: {
    id: string;
    name: string;
    price: number;
    stripePriceId?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentFormInner({ plan, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // For now, we'll simulate a successful payment
      // In a real implementation, you'd:
      // 1. Create a payment intent on your backend
      // 2. Confirm the payment with Stripe
      // 3. Handle the subscription creation
      
      setTimeout(() => {
        setProcessing(false);
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1a1612',
        '::placeholder': {
          color: '#6d6459',
        },
      },
      invalid: {
        color: '#C4704A',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-elevated max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-title-large font-medium text-on-surface dark:text-white mb-2">
              Complete Your Purchase
            </h3>
            <p className="text-body-medium text-on-surface-variant dark:text-gray-300">
              Upgrading to {plan.name} - ${plan.price}/month
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-body-medium font-medium text-on-surface dark:text-white mb-2">
                Payment Details
              </label>
              <div className="p-4 border border-outline-variant dark:border-gray-600 rounded-xl bg-surface-light dark:bg-surface-dark-container">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-40/10 border border-error-40/20 text-error-40">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="btn-outlined flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!stripe || processing}
                className="btn-filled flex-1 bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay $${plan.price}/month`
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-body-small text-on-surface-variant dark:text-gray-400">
            <p className="flex items-center justify-center gap-1">
              🔒 Secured by Stripe • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}