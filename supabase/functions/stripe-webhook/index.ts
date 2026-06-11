import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Termékek: a webhook price_id alapján dönt, mit aktivál.
// Korábban minden sikeres checkout is_pro=true-t adott — egy 490 Ft-os
// kártyafelfedés is teljes Pro-t aktivált.
const PRO_PRICE_ID = "price_1TcXG4B9BUbmA0wIpIjDmRuf";
const BOOST_PRICE_ID = "price_1Td5GlB9BUbmA0wI8uXEdzef";
const REVEAL_PRICE_ID = "price_1TdanQB9BUbmA0wIIvVBccrw";

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
      const priceId = session.metadata?.price_id || null;
      const customerId = typeof session.customer === "string" ? session.customer : null;

      if (userId) {
        // Customer ID eltárolása — az előfizetés-lemondásnál ebből keresünk (B9)
        if (customerId) {
          const { error: custErr } = await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
          if (custErr) console.error("stripe_customer_id mentés hiba:", custErr.message);
        }

        if (priceId === BOOST_PRICE_ID) {
          const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          const { error } = await supabase
            .from("profiles")
            .update({ boost_active: true, boost_expires_at: expiry })
            .eq("id", userId);
          if (error) throw error;
          console.log("Boost activated for user:", userId, "until", expiry);
        } else if (priceId === REVEAL_PRICE_ID) {
          // Kártyafelfedés: a kliens jelöli a konkrét kártyát, profilt nem módosítunk
          console.log("Reveal purchase completed for user:", userId);
        } else if (priceId === PRO_PRICE_ID || (!priceId && session.mode === "subscription")) {
          // A mode-fallback a deploy előtt indított, metadata nélküli sessionökhöz kell
          const { error } = await supabase
            .from("profiles")
            .update({ is_pro: true })
            .eq("id", userId);
          if (error) throw error;
          console.log("Pro activated for user:", userId);
        } else {
          console.warn("Ismeretlen price_id a checkoutban, nincs aktiválás:", priceId, "mode:", session.mode);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Elsődleges út: profil keresése a tárolt Stripe customer ID alapján
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      let targetId = profile?.id ?? null;

      if (!targetId) {
        // Fallback régi előfizetőkhöz (még nincs customer ID a profilban):
        // email-egyezés. A listUsers default 50-es lapozása miatt nagy perPage.
        const customerRes = await fetch(
          `https://api.stripe.com/v1/customers/${customerId}`,
          { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        const customer = await customerRes.json();

        if (customer.email) {
          const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (error) throw error;
          const user = users?.users?.find((u) => u.email === customer.email);
          targetId = user?.id ?? null;
        }
      }

      if (targetId) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_pro: false })
          .eq("id", targetId);
        if (updateError) throw updateError;
        console.log("Pro deactivated for user:", targetId);
      } else {
        console.warn("Lemondás: nem találtunk profilt a customerhez:", customerId);
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
