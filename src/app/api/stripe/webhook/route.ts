import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Map priceId → allowedEmails
const PLAN_LIMITS: Record<string, number> = {
  // Replace with your real Stripe Price IDs
  [process.env.STRIPE_PRICE_STARTER!]: 1,
  [process.env.STRIPE_PRICE_GROWTH!]: 5,
  [process.env.STRIPE_PRICE_PRO!]: 15,
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      //
      // ----------------------------------------------------
      // 🔥 When checkout finishes (user pays)
      // ----------------------------------------------------
      //
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Expand line items to get priceId cleanly
        const full = await stripe.checkout.sessions.retrieve(String(session.id), {
          expand: ["line_items"],
        });

        const customerId = full.customer as string | undefined;

        // Get clerkUserId from session metadata or customer.metadata
        let clerkUserId =
          (full.metadata?.clerkUserId as string | undefined) || undefined;

        if (!clerkUserId && customerId) {
          const customer = (await stripe.customers.retrieve(
            customerId
          )) as Stripe.Customer;
          clerkUserId =
            (customer.metadata?.clerkUserId as string | undefined) || undefined;
        }

        const priceId = full.line_items?.data?.[0]?.price?.id;

        if (!clerkUserId) {
          console.warn(
            "No clerkUserId on checkout.session.completed — cannot assign plan"
          );
          break;
        }

        // Save subscription row
        await prisma.userSubscription.upsert({
          where: { clerkUserId },
          update: {
            stripeCustomerId: customerId ?? "",
            priceId,
            status: "active",
          },
          create: {
            clerkUserId,
            stripeCustomerId: customerId ?? "",
            priceId,
            status: "active",
          },
        });

        // ----------------------------------------------------
        // NEW PART: create/update onboarding + plan limits
        // ----------------------------------------------------

        const allowedEmails = PLAN_LIMITS[priceId ?? ""] ?? 1; // default safety

        await prisma.userSettings.upsert({
          where: { clerkUserId },
          update: {
            onboardingStep: 1, // user must begin onboarding
            allowedEmails,
          },
          create: {
            clerkUserId,
            onboardingStep: 1,
            allowedEmails,
          },
        });

        break;
      }

      //
      // ----------------------------------------------------
      // 🔥 When subscription is updated or deleted
      // ----------------------------------------------------
      //
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const status = subscription.status;

        // Update subscription table
        await prisma.userSubscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status, priceId },
        });

        // Update allowed email limits too
        const allowedEmails = PLAN_LIMITS[priceId ?? ""] ?? 1;

        await prisma.userSettings.updateMany({
          where: { clerkUserId: { not: undefined } }, // safe
          data: {
            allowedEmails,
          },
        });

        break;
      }

      default:
        console.log("Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
