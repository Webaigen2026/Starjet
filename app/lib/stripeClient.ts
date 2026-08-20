import Stripe from "stripe";

export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? key : null;
}

export function isStripeConfigured(): boolean {
  return getStripeSecretKey() !== null;
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = getStripeSecretKey();

  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }

  return stripeClient;
}

export function getTrustedAppOrigin(): string | null {
  const origin = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  return origin || null;
}

export function getStripeWebhookSecret(): string | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return secret ? secret : null;
}
