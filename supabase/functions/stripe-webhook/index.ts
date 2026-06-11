import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log("Webhook event type:", event.type);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id || session.client_reference_id;

      console.log("Activating Pro for user:", userId);

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ is_pro: true })
          .eq("id", userId);
        if (error) throw error;
        console.log("Pro activated for user:", userId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const customerRes = await fetch(
        `https://api.stripe.com/v1/customers/${customerId}`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
      );
      const customer = await customerRes.json();

      if (customer.email) {
        const { data: users, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        const user = users?.users?.find((u) => u.email === customer.email);
        if (user?.id) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ is_pro: false })
            .eq("id", user.id);
          if (updateError) throw updateError;
          console.log("Pro deactivated for user:", user.id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
