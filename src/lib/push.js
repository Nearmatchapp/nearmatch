// Push-értesítés segédek — az App.jsx-ből kiemelve
import { supabase } from "../supabase.js";

export async function registerOneSignalUser(userId) {
  try {
    if (!window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.login(userId);
      await OneSignal.User.addTag("user_id", userId);
    });
  } catch (err) { console.warn("OneSignal hiba:", err); }
}

export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({ user_id: userId, title, body, data }),
    });
  } catch (err) { console.warn("Push hiba:", err); }
}
