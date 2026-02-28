export const getTickets = async () => {
  try { const r = localStorage.getItem("tickets"); return r ? JSON.parse(r) : {}; } catch { return {}; }
};
export const saveTickets = async (t) => { localStorage.setItem("tickets", JSON.stringify(t)); };
export const getResults = async () => {
  try { const r = localStorage.getItem("results"); return r ? JSON.parse(r) : []; } catch { return []; }
};
export const saveResults = async (r) => { localStorage.setItem("results", JSON.stringify(r)); };