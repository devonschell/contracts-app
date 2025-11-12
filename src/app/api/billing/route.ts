import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { action, priceId } = await req.json();

    // --- Clerk authentication ---
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    // --- Get or create Stripe customer ---
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      });
    }

    // --- Determine base URL safely ---
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_SITE_URL
        : "http://localhost:3002";

    // --- Handle checkout session ---
    if (action === "checkout") {
      if (!priceId) {
        return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        line_items: [
          {
            price: priceId, // ✅ must match your Stripe Price ID (e.g. price_12345)
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/settings?success=true`,
        cancel_url: `${baseUrl}/settings?canceled=true`,
        subscription_data: {
          metadata: { clerkUserId: userId, email },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // --- Handle billing portal ---
    if (action === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${baseUrl}/settings`,
      });

      return NextResponse.json({ url: portal.url });
    }

    // --- Invalid action fallback ---
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Stripe billing route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
