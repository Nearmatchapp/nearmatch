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
    // Caller identity always from JWT, never from body
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user: caller }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { photo_url, path } = await req.json();
    const user_id = caller.id;

    if (!photo_url) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const params = new URLSearchParams({
      url: photo_url,
      models: "nudity-2.1,offensive,gore-2.0",
      api_user: Deno.env.get("SIGHTENGINE_USER")!,
      api_secret: Deno.env.get("SIGHTENGINE_SECRET")!,
    });

    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const result = await res.json();

    console.log("Sightengine result:", JSON.stringify(result));

    const nudity = (result.nudity?.sexual_activity > 0.5) || (result.nudity?.sexual_display > 0.5) || (result.nudity?.erotica > 0.6);
    const offensive = result.offensive?.prob > 0.7;
    const gore = result.gore?.prob > 0.7;
    const approved = !nudity && !offensive && !gore;

    if (!approved) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      if (path) {
        // Only allow deleting files owned by the calling user (path format: "userId/filename")
        if (!path.startsWith(`${user_id}/`)) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        await supabase.storage.from("avatars").remove([path]);
      }
      const reason = nudity ? "nudity" : offensive ? "offensive" : "gore";
      return new Response(JSON.stringify({ approved: false, reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ approved: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("moderate-image error:", err);
    // Fail-closed: moderation error rejects the image rather than approving it
    return new Response(JSON.stringify({ approved: false, reason: "moderation_unavailable" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
