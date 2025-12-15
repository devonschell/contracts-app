import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Helper to safely get base URL
function getBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.startsWith("http")) {
    return fromEnv;
  }
  return "http://localhost:3002";
}

// ---------- GET /api/billing ----------
// Returns { subscribed: boolean } for the current user
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    // Not logged in → not subscribed
    if (!userId) {
      return NextResponse.json({ subscribed: false });
    }

    // Dev bypass user is always treated as subscribed
    if (
      process.env.DEV_BYPASS_USER_ID &&
      userId === process.env.DEV_BYPASS_USER_ID
    ) {
      return NextResponse.json({ subscribed: true });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ subscribed: false });
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json({ subscribed: false });
    }

    // Check if the customer has any active/trialing subscription
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    const hasActive = subs.data.some((sub) =>
      ["active", "trialing", "past_due"].includes(sub.status)
    );

    return NextResponse.json({ subscribed: hasActive });
  } catch (err: any) {
    console.error("Stripe billing GET error:", err);
    return NextResponse.json(
      { subscribed: false, error: err.message ?? "Billing check failed" },
      { status: 200 }
    );
  }
}

// ---------- POST /api/billing ----------
// { action: "checkout" | "portal", priceId?: string }
export async function POST(req: Request) {
  try {
    const { action, priceId } = await req.json();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      });
    }

    const baseUrl = getBaseUrl();

    // ----- Start a checkout session -----
    if (action === "checkout") {
      if (!priceId) {
        return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // After successful checkout → onboarding/welcome
        success_url: `${baseUrl}/welcome?checkout=success`,
        // If user cancels checkout → billing page
        cancel_url: `${baseUrl}/billing?checkout=canceled`,
        subscription_data: {
          metadata: { clerkUserId: userId, email },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // ----- Open billing portal -----
    if (action === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        // FIX: Return to /settings (NOT /settings/billing)
        return_url: `${baseUrl}/settings`,
      });

      return NextResponse.json({ url: portal.url });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Stripe billing route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
