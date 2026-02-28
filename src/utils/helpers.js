export const genTicket = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let t = "DP-";
  for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
};

export const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};
export const isExpired = (expiry) => new Date(expiry) < new Date(new Date().toDateString());
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
