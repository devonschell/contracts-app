import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { action, priceId, customerEmail } = await req.json();

    if (action === "checkout") {
      const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?canceled=true`,
      });
      return NextResponse.json({ url: session.url });
    }

    if (action === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer_email: customerEmail,
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
