// Stripe Webhook Handler
// Processes payment events from Stripe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/payment/stripe";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = headers().get("stripe-signature")!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await handleCheckoutCompleted(session, prisma);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any, prisma: any) {
  const { userId, planType, billingCycle } = session.metadata;
  console.log(`[Webhook] Checkout completed for user ${userId}, plan ${planType}`);

  // Calculate period end date
  const periodEndMs =
    billingCycle === "monthly"
      ? 30 * 24 * 60 * 60 * 1000
      : 365 * 24 * 60 * 60 * 1000;
  const currentPeriodEnd = new Date(Date.now() + periodEndMs);

  // Update subscription
  await prisma.subscription.update({
    where: { userId },
    data: {
      planType: planType as any,
      status: "ACTIVE",
      stripeCustomerId: session.customer,
      currentPeriodEnd,
    },
  });

  // Get subscription ID for payment record
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (subscription && session.payment_intent) {
    // Retrieve payment intent details
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent
    );

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        stripePaymentIntentId: paymentIntent.id,
        stripeCheckoutSessionId: session.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: {
          planType,
          billingCycle,
        },
      },
    });

    console.log(`[Webhook] Payment recorded: ${paymentIntent.id}`);
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
  // Additional payment success handling if needed
}
