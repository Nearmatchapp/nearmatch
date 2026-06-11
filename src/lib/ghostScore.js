import { supabase } from "../supabase.js";

// Ghost Score – kiszámítása kliens oldalon a saját matches/messages alapján,
// majd eltárolva a profiles táblában. Más userek score-ját a profiles-ból olvassuk.
export async function calcAndSaveGhostScore(userId) {
  try {
    const { data: matches } = await supabase.from("matches").select("id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (!matches || matches.length === 0) {
      await supabase.from("profiles").update({ ghost_score: null }).eq("id", userId);
      return null;
    }
    const total = matches.length;
    let replied = 0;
    for (const m of matches) {
      const { data: msgs } = await supabase.from("messages").select("id").eq("match_id", m.id).eq("sender_id", userId).limit(1);
      if (msgs && msgs.length > 0) replied++;
    }
    const score = Math.round((replied / total) * 100);
    await supabase.from("profiles").update({ ghost_score: score }).eq("id", userId);
    return score;
  } catch { return null; }
}

