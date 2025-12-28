// Stripe Payment Configuration
// Handles Stripe client and product price IDs

import Stripe from "stripe";

// Lazy initialization of Stripe to avoid build errors
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia" as any,
    typescript: true,
  });
}

// Stripe Product Price IDs (configure in Stripe Dashboard)
export const PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY!,
  ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  ENTERPRISE_YEARLY: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
};

// Quota limits per plan
export const QUOTA_LIMITS = {
  FREE: 10,
  PRO: 1000,    // Effectively unlimited
  ENTERPRISE: -1, // -1 means truly unlimited
};
