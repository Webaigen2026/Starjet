import { prisma } from "../../../lib/prisma";
import {
  getStripe,
  getStripeWebhookSecret,
} from "../../../lib/stripeClient";
import {
  handleStripeWebhookRequest,
  processStripeWebhookEvent,
} from "../../../lib/stripeWebhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStripeWebhookRequest(request, {
    getWebhookSecret: getStripeWebhookSecret,
    constructEvent: (payload, signature, secret) =>
      getStripe().webhooks.constructEvent(payload, signature, secret),
    processEvent: (event) =>
      processStripeWebhookEvent(prisma as never, event),
  });
}
