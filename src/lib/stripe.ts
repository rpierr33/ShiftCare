import Stripe from 'stripe';

// Lazily-initialized Stripe client singleton
let _stripe: Stripe | null = null;

// Returns the Stripe client, initializing it on first call
// Throws if STRIPE_SECRET_KEY is missing — fail-fast on misconfiguration
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set. Add it to your .env file.'
      );
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// Named export using Proxy for backward compatibility with `import { stripe }`
// Property access on this proxy is forwarded to the lazily-initialized Stripe client
// This avoids throwing at import time if STRIPE_SECRET_KEY is not yet set
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
