// src/app/api/stripe/webhook/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Map priceId → allowedEmails
const PLAN_LIMITS: Record<string, number> = {
  [process.env.STRIPE_PRICE_STARTER!]: 1,
  [process.env.STRIPE_PRICE_GROWTH!]: 5,
  [process.env.STRIPE_PRICE_PRO!]: 15,
};

// Helper: Update Clerk user metadata
async function updateClerkMetadata(
  clerkUserId: string,
  data: { subscriptionStatus?: string; onboardingStep?: number }
) {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: data,
    });
    console.log(`✅ Clerk metadata updated for ${clerkUserId}:`, data);
  } catch (err) {
    console.error(`❌ Failed to update Clerk metadata for ${clerkUserId}:`, err);
  }
}

// Helper: Get clerkUserId from Stripe customer
async function getClerkUserIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const sub = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: customerId },
      select: { clerkUserId: true },
    });
    return sub?.clerkUserId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      // --------------------------------------------------------
      // 🔥 CHECKOUT COMPLETED (user pays for first time)
      // --------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Expand line items to get priceId
        const full = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });

        const customerId = full.customer as string | undefined;

        // Get clerkUserId from metadata
        let clerkUserId = full.metadata?.clerkUserId as string | undefined;

        if (!clerkUserId && customerId) {
          const customer = (await stripe.customers.retrieve(
            customerId
          )) as Stripe.Customer;
          clerkUserId = customer.metadata?.clerkUserId as string | undefined;
        }

        const priceId = full.line_items?.data?.[0]?.price?.id;

        if (!clerkUserId) {
          console.warn("⚠️ No clerkUserId on checkout.session.completed");
          break;
        }

        // Save to Prisma: UserSubscription
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

        // Save to Prisma: UserSettings (onboarding + plan limits)
        const allowedEmails = PLAN_LIMITS[priceId ?? ""] ?? 1;

        await prisma.userSettings.upsert({
          where: { clerkUserId },
          update: {
            onboardingStep: 1,
            allowedEmails,
          },
          create: {
            clerkUserId,
            onboardingStep: 1,
            allowedEmails,
          },
        });

        // 🔥 UPDATE CLERK METADATA (this is the key!)
        await updateClerkMetadata(clerkUserId, {
          subscriptionStatus: "active",
          onboardingStep: 1,
        });

        console.log(`✅ Checkout complete for ${clerkUserId}, plan: ${priceId}`);
        break;
      }

      // --------------------------------------------------------
      // 🔥 SUBSCRIPTION UPDATED (plan change, renewal, etc.)
      // --------------------------------------------------------
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const stripeStatus = subscription.status;

        // Map Stripe status to our status
        let status: string;
        if (stripeStatus === "active" || stripeStatus === "trialing") {
          status = "active";
        } else if (stripeStatus === "past_due") {
          status = "past_due";
        } else {
          status = "inactive";
        }

        // Update Prisma
        await prisma.userSubscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status, priceId },
        });

        // Update plan limits
        const allowedEmails = PLAN_LIMITS[priceId ?? ""] ?? 1;
        const clerkUserId = await getClerkUserIdFromCustomer(customerId);

        if (clerkUserId) {
          await prisma.userSettings.updateMany({
            where: { clerkUserId },
            data: { allowedEmails },
          });

          // 🔥 UPDATE CLERK METADATA
          await updateClerkMetadata(clerkUserId, {
            subscriptionStatus: status,
          });
        }

        console.log(`✅ Subscription updated for customer ${customerId}: ${status}`);
        break;
      }

      // --------------------------------------------------------
      // 🔥 SUBSCRIPTION DELETED (canceled or expired)
      // --------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Update Prisma
        await prisma.userSubscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: "inactive" },
        });

        // 🔥 UPDATE CLERK METADATA
        const clerkUserId = await getClerkUserIdFromCustomer(customerId);
        if (clerkUserId) {
          await updateClerkMetadata(clerkUserId, {
            subscriptionStatus: "inactive",
          });
        }

        console.log(`✅ Subscription deleted for customer ${customerId}`);
        break;
      }

      // --------------------------------------------------------
      // 🔥 INVOICE PAYMENT FAILED (card declined, etc.)
      // --------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Update to past_due
        await prisma.userSubscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: "past_due" },
        });

        // 🔥 UPDATE CLERK METADATA
        const clerkUserId = await getClerkUserIdFromCustomer(customerId);
        if (clerkUserId) {
          await updateClerkMetadata(clerkUserId, {
            subscriptionStatus: "past_due",
          });
        }

        console.log(`⚠️ Payment failed for customer ${customerId}`);
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
