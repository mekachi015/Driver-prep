import { useState } from "react";
import { getTickets } from "../utils/storage";
import { isExpired } from "../utils/helpers";
import { ADMIN_PIN } from "../utils/constants";

function HomeScreen({ setScreen, setCurrentTicket }) {
  const [ticketInput, setTicketInput] = useState("");
  const [error, setError] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const tickets = await getTickets();
    const key = ticketInput.trim().toUpperCase();
    if (!tickets[key]) { setError("Ticket not found. Please check your ticket number."); setLoading(false); return; }
    if (isExpired(tickets[key].expiry)) { setError(`This ticket expired on ${tickets[key].expiry}. Purchase a new ticket to continue.`); setLoading(false); return; }
    setCurrentTicket({ ...tickets[key], number: key });
    setScreen("test");
    setLoading(false);
  };

  const handleAdmin = () => {
    if (adminInput === ADMIN_PIN) { setScreen("admin"); }
    else { setError("Incorrect admin PIN."); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", overflow: "hidden" }}>
      {/* Background decoration */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "300px", background: "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(201,168,76,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="fade-in" style={{ width: "100%", maxWidth: "440px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "flex", background: "linear-gradient(135deg, #c9a84c, #f0d080)", borderRadius: "50%", width: "72px", height: "72px", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 40px rgba(201,168,76,0.4)" }}>
            <span style={{ fontSize: "32px" }}>🚗</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", fontWeight: 900, color: "#f0d080", letterSpacing: "-1px", lineHeight: 1 }}>DrivePrep SA</h1>
          <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "13px", color: "#8a7a60", marginTop: "8px", letterSpacing: "3px", textTransform: "uppercase" }}>K53 Learner's Licence Practice</p>
        </div>

        {/* Login Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "16px", padding: "36px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#e8dcc8", marginBottom: "24px" }}>Enter Your Ticket</h2>
          <input
            value={ticketInput}
            onChange={e => setTicketInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="e.g. DP-AB34CD56"
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "14px 16px", color: "#f0d080", fontSize: "18px", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "12px" }}
          />
          <button onClick={handleLogin} disabled={loading || !ticketInput} className="btn" style={{ width: "100%", background: loading ? "#4a3d20" : "linear-gradient(135deg, #c9a84c, #f0d080)", color: "#0a0f1e", padding: "14px", borderRadius: "8px", fontSize: "15px", fontWeight: 700, fontFamily: "'Source Sans 3', sans-serif", letterSpacing: "1px" }}>
            {loading ? "Verifying..." : "Start Practice Test →"}
          </button>
          {error && <p style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>{error}</p>}
        </div>

        {/* Admin section */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          {!showAdmin ? (
            <button onClick={() => setShowAdmin(true)} className="btn" style={{ background: "none", color: "#8a7a60", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase" }}>
              Admin Access
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={adminInput} onChange={e => setAdminInput(e.target.value)} type="password" placeholder="Admin PIN" onKeyDown={e => e.key === "Enter" && handleAdmin()} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#e8dcc8", fontSize: "14px" }} />
              <button onClick={handleAdmin} className="btn" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "#f0d080", padding: "10px 16px", borderRadius: "8px", fontSize: "13px" }}>Enter</button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#4a3d20", marginTop: "32px", letterSpacing: "1px" }}>
          © 2025 DrivePrep SA · Admin PIN: admin123
        </p>
      </div>
    </div>
  );
}