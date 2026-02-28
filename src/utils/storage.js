export const getTickets = async () => {
  try { const r = await window.storage.get("tickets"); return r ? JSON.parse(r.value) : {}; } catch { return {}; }
};
export const saveTickets = async (t) => { await window.storage.set("tickets", JSON.stringify(t)); };
export const getResults = async () => {
  try { const r = await window.storage.get("results"); return r ? JSON.parse(r.value) : []; } catch { return []; }
};
export const saveResults = async (r) => { await window.storage.set("results", JSON.stringify(r)); };