const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PRICE_IDS = new Set([
  "price_1TcXG4B9BUbmA0wIpIjDmRuf",
  "price_1Td5GlB9BUbmA0wI8uXEdzef",
  "price_1TdanQB9BUbmA0wIIvVBccrw",
]);

const ALLOWED_HOSTS = new Set([
  "nearmatch.vercel.app",
  "nearmatch.io",
  "www.nearmatch.io",
]);

const ALLOWED_MODES = new Set(["payment", "subscription"]);

const isAllowedUrl = (url: string): boolean => {
  try { return ALLOWED_HOSTS.has(new URL(url).hostname); }
  catch { return false; }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://nearmatch.vercel.app";

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
        },
      }
    );
    const userData = await userRes.json();
    if (!userData.id) throw new Error("Invalid user");

    const { price_id, mode, success_url, cancel_url } = await req.json();

    if (!price_id || !ALLOWED_PRICE_IDS.has(price_id)) {
      return new Response(JSON.stringify({ error: "Invalid price_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutMode = mode || "subscription";
    if (!ALLOWED_MODES.has(checkoutMode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const successUrl = success_url || `${APP_URL}?pro=success`;
    const cancelUrl = cancel_url || `${APP_URL}?pro=cancel`;

    if (success_url && !isAllowedUrl(success_url)) {
      return new Response(JSON.stringify({ error: "Invalid success_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (cancel_url && !isAllowedUrl(cancel_url)) {
      return new Response(JSON.stringify({ error: "Invalid cancel_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      mode: checkoutMode,
      "payment_method_types[0]": "card",
      "line_items[0][price]": price_id,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userData.id,
      customer_email: userData.email,
      "metadata[user_id]": userData.id,
      "metadata[mode]": checkoutMode,
      "metadata[price_id]": price_id,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      throw new Error(session.error.message);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
