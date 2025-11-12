import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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
      case "checkout.session.completed": {
        // Retrieve full session with line items to get priceId
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionWithItems = await stripe.checkout.sessions.retrieve(
          String(session.id),
          { expand: ["line_items"] }
        );

        const customerId = session.customer as string | undefined;

        // Get clerkUserId from session metadata OR from the Stripe customer.metadata
        let clerkUserId: string | undefined =
          (session.metadata?.clerkUserId as string | undefined) || undefined;

        if (!clerkUserId && customerId) {
          const customer = (await stripe.customers.retrieve(
            customerId
          )) as Stripe.Customer;
          clerkUserId = (customer.metadata?.clerkUserId as string | undefined) || undefined;
        }

        const priceId =
          sessionWithItems.line_items?.data?.[0]?.price?.id ?? undefined;

        if (clerkUserId) {
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
        } else {
          console.warn(
            "checkout.session.completed received but clerkUserId was not found on session/customer metadata"
          );
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items?.data?.[0]?.price?.id ?? undefined;

        await prisma.userSubscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status, priceId },
        });
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
