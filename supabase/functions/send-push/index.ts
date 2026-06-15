import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ONESIGNAL_APP_ID = "ac1a4664-cec3-4e0c-9e27-91218932b9f1";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, title, body, data } = await req.json();

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders
      });
    }

    if (caller.id !== user_id) {
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user1_id.eq.${caller.id},user2_id.eq.${user_id}),` +
          `and(user1_id.eq.${user_id},user2_id.eq.${caller.id})`
        )
        .eq("status", "active")
        .maybeSingle();
      if (!match) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: corsHeaders
        });
      }
    }

    // A címzett értesítési beállításai — a tiltott típust kihagyjuk.
    // (match → notif_match, message → notif_message; egyéb típus mindig megy.)
    const notifType = data?.type;
    if (notifType === "match" || notifType === "message") {
      const col = notifType === "match" ? "notif_match" : "notif_message";
      const { data: prefRow } = await supabase
        .from("profiles")
        .select(col)
        .eq("id", user_id)
        .maybeSingle();
      if (prefRow && prefRow[col] === false) {
        return new Response(JSON.stringify({ success: true, skipped: "muted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: "tag", key: "user_id", relation: "=", value: user_id }
        ],
        headings: { en: title },
        contents: { en: body },
        data: data || {},
        url: "https://nearmatch.vercel.app",
      }),
    });

    const result = await response.json();
    console.log("OneSignal response:", JSON.stringify(result));

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Hiba:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
