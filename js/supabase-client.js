// ============================================================
// Supabase 연동 — RSVP(참석 여부) 저장
// ============================================================

const SupabaseRSVP = (() => {
  let client = null;

  function getClient() {
    if (!client) {
      client = window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
      );
    }
    return client;
  }

  /**
   * @param {{guestName: string, attending: boolean, guestCount: number, invitedAs: string}} data
   */
  async function submit(data) {
    const c = getClient();
    const { error } = await c.from(CONFIG.supabase.table).insert({
      guest_name: data.guestName,
      attending: data.attending,
      guest_count: data.guestCount,
      invited_as: data.invitedAs || null,
    });
    if (error) throw error;
    return true;
  }

  return { submit };
})();
