import { NextResponse } from "next/server";
import Stripe from "stripe";

// Ensure we run in the Node runtime (Stripe SDK requires Node, not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  // Stripe needs the raw body for signature verification
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err?.message);
    return new NextResponse(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // If you added metadata during checkout, you can read it here:
        // e.g., subscription.metadata.clerkUserId
        const clerkUserId = subscription.metadata?.clerkUserId;

        // TODO: Update your DB: plan, status, current period, etc.
        // Example placeholders:
        // await prisma.user.update({
        //   where: { clerkUserId },
        //   data: {
        //     plan: subscription.items.data[0]?.price?.nickname ?? "Starter",
        //     stripeCustomerId: subscription.customer as string,
        //     stripeSubscriptionId: subscription.id,
        //     subscriptionStatus: subscription.status, // active, past_due, canceled, etc.
        //   },
        // });

        console.log("🔁", event.type, { clerkUserId, sub: subscription.id, status: subscription.status });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        const customerId = session.customer as string | undefined;
        console.log("✅ checkout.session.completed", { clerkUserId, customerId });
        // Optionally persist stripeCustomerId here if not already stored.
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("🔥 Webhook handler error:", err?.message);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
