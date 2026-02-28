import { useState, useEffect } from "react";
import { getTickets, saveTickets, getResults } from "../utils/storage";
import {genTicket, addDays, isExpired } from "../utils/helper";


function AdminScreen({ setScreen }) {
  const [tab, setTab] = useState("tickets");
  const [tickets, setTickets] = useState({});
  const [results, setResults] = useState([]);
  const [name, setName] = useState("");
  const [days, setDays] = useState(7);
  const [newTicket, setNewTicket] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getTickets().then(setTickets);
    getResults().then(setResults);
  }, []);

  const createTicket = async () => {
    if (!name.trim()) { setMsg("Please enter a client name."); return; }
    const num = genTicket();
    const expiry = addDays(Number(days));
    const updated = { ...tickets, [num]: { name: name.trim(), days: Number(days), expiry, created: new Date().toISOString().split("T")[0] } };
    await saveTickets(updated);
    setTickets(updated);
    setNewTicket({ num, name: name.trim(), days, expiry });
    setName(""); setDays(7);
  };

  const deactivate = async (key) => {
    const updated = { ...tickets };
    updated[key] = { ...updated[key], expiry: "2000-01-01" };
    await saveTickets(updated);
    setTickets(updated);
  };

  const prices = { 3: "R20", 7: "R50", 30: "R120" };
  const activeCount = Object.entries(tickets).filter(([, v]) => !isExpired(v.expiry)).length;

  return (
    <div style={{ minHeight: "100vh", padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div className="fade-in">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#f0d080" }}>Admin Dashboard</h1>
            <p style={{ color: "#8a7a60", fontSize: "13px", marginTop: "4px" }}>DrivePrep SA Control Panel</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", color: "#f0d080", fontWeight: 700 }}>{activeCount}</div>
              <div style={{ fontSize: "10px", color: "#8a7a60", letterSpacing: "1px" }}>ACTIVE</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", color: "#f0d080", fontWeight: 700 }}>{results.length}</div>
              <div style={{ fontSize: "10px", color: "#8a7a60", letterSpacing: "1px" }}>TESTS DONE</div>
            </div>
            <button onClick={() => setScreen("home")} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8a7a60", padding: "10px 16px", borderRadius: "8px", fontSize: "13px" }}>← Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
          {["tickets", "results"].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn" style={{ background: tab === t ? "rgba(201,168,76,0.2)" : "none", border: tab === t ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent", color: tab === t ? "#f0d080" : "#8a7a60", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", letterSpacing: "1px", textTransform: "capitalize" }}>
              {t === "tickets" ? "🎫 Tickets" : "📊 Results"}
            </button>
          ))}
        </div>

        {tab === "tickets" && (
          <div>
            {/* Create Ticket */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#e8dcc8", marginBottom: "20px" }}>Create New Ticket</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Client name / surname" style={{ flex: "1 1 200px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "12px 14px", color: "#e8dcc8", fontSize: "14px" }} />
                <select value={days} onChange={e => setDays(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "12px 14px", color: "#e8dcc8", fontSize: "14px" }}>
                  <option value={3}>3 Days — R20</option>
                  <option value={7}>7 Days — R50</option>
                  <option value={30}>30 Days — R120</option>
                </select>
                <button onClick={createTicket} className="btn" style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)", color: "#0a0f1e", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700 }}>
                  Generate Ticket
                </button>
              </div>
              {msg && <p style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "8px" }}>{msg}</p>}
            </div>

            {/* New Ticket Display */}
            {newTicket && (
              <div className="fade-in" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
                <p style={{ color: "#8a7a60", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>NEW TICKET GENERATED — SEND TO CLIENT</p>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "28px", color: "#f0d080", letterSpacing: "3px", fontWeight: 700 }}>{newTicket.num}</span>
                  <div style={{ color: "#e8dcc8", fontSize: "14px" }}>
                    <span style={{ color: "#8a7a60" }}>Client: </span>{newTicket.name} &nbsp;·&nbsp;
                    <span style={{ color: "#8a7a60" }}>Access: </span>{newTicket.days} days &nbsp;·&nbsp;
                    <span style={{ color: "#8a7a60" }}>Expires: </span>{newTicket.expiry} &nbsp;·&nbsp;
                    <span style={{ color: "#8a7a60" }}>Price: </span>{prices[newTicket.days] || ""}
                  </div>
                </div>
              </div>
            )}

            {/* Tickets List */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", color: "#8a7a60", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>
                <span>Ticket</span><span>Client</span><span>Days</span><span>Expires</span><span>Action</span>
              </div>
              {Object.entries(tickets).length === 0 && <p style={{ padding: "24px", color: "#4a3d20", textAlign: "center" }}>No tickets yet. Create one above.</p>}
              {Object.entries(tickets).reverse().map(([key, val]) => {
                const expired = isExpired(val.expiry);
                return (
                  <div key={key} style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "center", opacity: expired ? 0.5 : 1 }}>
                    <span style={{ fontFamily: "monospace", color: "#f0d080", fontSize: "13px" }}>{key}</span>
                    <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{val.name}</span>
                    <span style={{ fontSize: "14px", color: "#8a7a60" }}>{val.days}d</span>
                    <span style={{ fontSize: "13px", color: expired ? "#ff6b6b" : "#6bffb8" }}>{val.expiry} {expired ? "✗" : "✓"}</span>
                    {!expired && <button onClick={() => deactivate(key)} className="btn" style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b", padding: "6px 12px", borderRadius: "6px", fontSize: "11px" }}>Deactivate</button>}
                    {expired && <span style={{ fontSize: "11px", color: "#4a3d20" }}>Expired</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "results" && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", color: "#8a7a60", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>
              <span>Date</span><span>Client</span><span>Ticket</span><span>Score</span><span>Result</span>
            </div>
            {results.length === 0 && <p style={{ padding: "24px", color: "#4a3d20", textAlign: "center" }}>No test results yet.</p>}
            {[...results].reverse().map((r, i) => (
              <div key={i} style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#8a7a60" }}>{r.date}</span>
                <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{r.name}</span>
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#f0d080" }}>{r.ticket}</span>
                <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{r.score}/{r.total} ({r.pct}%)</span>
                <span style={{ color: r.passed ? "#6bffb8" : "#ff6b6b", fontSize: "13px", fontWeight: 700 }}>{r.passed ? "PASS ✓" : "FAIL ✗"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}