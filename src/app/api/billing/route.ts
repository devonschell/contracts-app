import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { action, priceId } = await req.json();

    // Get Clerk user info
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    // Ensure we have an email
    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    // Try to find or create a Stripe customer for this user
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customer = existingCustomers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      });
    }

    // ---- Checkout session ----
    if (action === "checkout") {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?canceled=true`,
        subscription_data: {
          metadata: { clerkUserId: userId, email },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // ---- Billing portal ----
    if (action === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`,
      });

      return NextResponse.json({ url: portal.url });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Stripe route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
