import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/authorization";
import { getStripe, isStripeConfigured } from "../../../../lib/stripeClient";
import { handlePaymentRefundRequest } from "../../../../lib/paymentRefund";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  return handlePaymentRefundRequest(request, paymentId, {
    getAuth: requireAdmin,
    isStripeConfigured,
    getStripe: getStripe as never,
    db: prisma as never,
  });
}
