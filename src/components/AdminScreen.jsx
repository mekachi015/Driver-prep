import { useState, useEffect, useRef } from "react";
import { getTickets, saveTickets, getResults, getCustomQuestions, saveCustomQuestions } from "../utils/storage";
import { genTicket, addDays, isExpired } from "../utils/helpers";
import { QUESTIONS_DB } from "../data/questions";

const CATEGORIES = ["Road Signs", "Rules of the Road", "Vehicle Controls"];
const BLANK_FORM = { category: "Rules of the Road", question: "", options: ["", "", ""], answer: 0, image: "" };


function AdminScreen({ setScreen }) {
  const [tab, setTab] = useState("tickets");
  const [tickets, setTickets] = useState({});
  const [results, setResults] = useState([]);
  const [name, setName] = useState("");
  const [days, setDays] = useState(7);
  const [newTicket, setNewTicket] = useState(null);
  const [msg, setMsg] = useState("");

  // Questions tab state
  const [customQuestions, setCustomQuestions] = useState([]);
  const [qForm, setQForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState(null); // null = adding new
  const [showForm, setShowForm] = useState(false);
  const [qSearch, setQSearch] = useState("");
  const [qCatFilter, setQCatFilter] = useState("all");
  const [qSource, setQSource] = useState("custom"); // "custom" | "builtin"
  const [qPage, setQPage] = useState(1);
  const [qMsg, setQMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedQId, setExpandedQId] = useState(null);
  const [originalBuiltinId, setOriginalBuiltinId] = useState(null);
  const formRef = useRef(null);
  const PAGE_SIZE = 15;

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) { setScreen("home"); return; }
    try {
      const [, expiry] = atob(token).split(":");
      if (Date.now() > Number(expiry)) { sessionStorage.removeItem("adminToken"); setScreen("home"); return; }
    } catch { sessionStorage.removeItem("adminToken"); setScreen("home"); return; }
    getTickets().then(setTickets);
    getResults().then(setResults);
    getCustomQuestions().then(setCustomQuestions);
  }, []);

  // ── Question CRUD ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setQForm(BLANK_FORM);
    setEditingId(null);
    setQMsg("");
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const openEdit = (q) => {
    setQForm({ category: q.category, question: q.question, options: [...q.options], answer: q.answer, image: q.image || "" });
    setEditingId(q.id);
    setQMsg("");
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setQForm(BLANK_FORM); setQMsg(""); setOriginalBuiltinId(null); };

  // Pre-fill form with a built-in question so admin can save an edited custom copy.
  // The original built-in ID is remembered so it gets hidden from the built-in list on save.
  const openCopyBuiltin = (q) => {
    setQForm({ category: q.category, question: q.question, options: [...q.options], answer: q.answer, image: q.image || "" });
    setEditingId(null);
    setOriginalBuiltinId(q.id);
    setQMsg("");
    setShowForm(true);
    setQSource("custom");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const saveQuestion = async () => {
    if (!qForm.question.trim()) { setQMsg("Question text is required."); return; }
    if (qForm.options.some(o => !o.trim())) { setQMsg("All options must be filled in."); return; }
    if (qForm.options.length < 2) { setQMsg("At least 2 options are required."); return; }
    setQMsg("Saving...");
    try {
      let updated;
      if (editingId !== null) {
        updated = customQuestions.map(q => q.id === editingId ? { ...q, ...qForm } : q);
      } else {
        const newQ = { ...qForm, id: `custom_${Date.now()}`, source: "custom",
          ...(originalBuiltinId !== null ? { originalId: originalBuiltinId } : {}) };
        updated = [...customQuestions, newQ];
      }
      await saveCustomQuestions(updated);
      setCustomQuestions(updated);
      cancelForm();
    } catch (e) {
      setQMsg("Error saving: " + e.message);
    }
  };

  const confirmDelete = async (id) => {
    try {
      const updated = customQuestions.filter(q => q.id !== id);
      await saveCustomQuestions(updated);
      setCustomQuestions(updated);
      setDeleteConfirm(null);
    } catch (e) {
      setQMsg("Error deleting: " + e.message);
    }
  };

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setQMsg("Image too large (max 5 MB). Use an external URL instead."); return; }
    const reader = new FileReader();
    reader.onload = ev => setQForm(f => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const setOption = (i, val) => setQForm(f => { const opts = [...f.options]; opts[i] = val; return { ...f, options: opts }; });
  const addOption = () => { if (qForm.options.length < 4) setQForm(f => ({ ...f, options: [...f.options, ""] })); };
  const removeOption = (i) => {
    if (qForm.options.length <= 2) return;
    setQForm(f => {
      const opts = f.options.filter((_, idx) => idx !== i);
      return { ...f, options: opts, answer: Math.min(f.answer, opts.length - 1) };
    });
  };

  // IDs of built-in questions that have been replaced by a custom copy.
  const overriddenBuiltinIds = new Set(customQuestions.map(q => q.originalId).filter(Boolean));

  // Filtered question lists
  const builtinFiltered = QUESTIONS_DB.filter(q =>
    !overriddenBuiltinIds.has(q.id) &&
    (qCatFilter === "all" || q.category === qCatFilter) &&
    q.question.toLowerCase().includes(qSearch.toLowerCase())
  );
  const customFiltered = customQuestions.filter(q =>
    (qCatFilter === "all" || q.category === qCatFilter) &&
    q.question.toLowerCase().includes(qSearch.toLowerCase())
  );
  const activeList = qSource === "custom" ? customFiltered : builtinFiltered;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const pagedList = activeList.slice((qPage - 1) * PAGE_SIZE, qPage * PAGE_SIZE);

  const createTicket = async () => {
    if (!name.trim()) { setMsg("Please enter a client name."); return; }
    setMsg("Creating ticket...");
    try {
      const num = genTicket();
      const expiry = addDays(Number(days));
      const updated = { ...tickets, [num]: { name: name.trim(), days: Number(days), expiry, created: new Date().toISOString().split("T")[0] } };
      await saveTickets(updated);
      setTickets(updated);
      setNewTicket({ num, name: name.trim(), days, expiry });
      setName(""); setDays(7);
      setMsg("");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  };

  const deactivate = async (key) => {
    const updated = { ...tickets };
    updated[key] = { ...updated[key], expiry: "2000-01-01" };
    await saveTickets(updated);
    setTickets(updated);
  };

  const prices = { 3: "R20", 7: "R50", 30: "R120" };
  const activeCount = Object.entries(tickets).filter(([, v]) => !isExpired(v.expiry)).length;
  const totalQCount = QUESTIONS_DB.length + customQuestions.length;

  return (
    <div style={{ minHeight: "100vh", padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div className="fade-in">
        {/* Header */}
        <div className="admin-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "var(--secondary-gold)" }}>Admin Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>DrivePrep SA Control Panel</p>
          </div>
          <div className="admin-header-right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", color: "var(--secondary-gold)", fontWeight: 700 }}>{activeCount}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px" }}>ACTIVE</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", color: "var(--secondary-gold)", fontWeight: 700 }}>{results.length}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px" }}>TESTS DONE</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", color: "var(--secondary-gold)", fontWeight: 700 }}>{totalQCount}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px" }}>QUESTIONS</div>
            </div>
            <button onClick={() => { sessionStorage.removeItem("adminToken"); setScreen("home"); }} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", padding: "10px 16px", borderRadius: "8px", fontSize: "13px" }}>← Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content", flexWrap: "wrap" }}>
          {["tickets", "results", "questions"].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn" style={{ background: tab === t ? "rgba(201,168,76,0.2)" : "none", border: tab === t ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent", color: tab === t ? "var(--secondary-gold)" : "var(--text-muted)", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", letterSpacing: "1px", textTransform: "capitalize" }}>
              {t === "tickets" ? "🎫 Tickets" : t === "results" ? "📊 Results" : "📝 Questions"}
            </button>
          ))}
        </div>

        {tab === "tickets" && (
          <div>
            {/* Create Ticket */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "var(--text-main)", marginBottom: "20px" }}>Create New Ticket</h3>
              <div className="ticket-form" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Client name / surname" style={{ flex: "1 1 200px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "12px 14px", color: "var(--text-main)", fontSize: "14px" }} />
                <select value={days} onChange={e => setDays(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "12px 14px", color: "var(--text-main)", fontSize: "14px" }}>
                  <option value={3}>3 Days — R20</option>
                  <option value={7}>7 Days — R50</option>
                  <option value={30}>30 Days — R120</option>
                </select>
                <button onClick={createTicket} className="btn" style={{ background: "linear-gradient(135deg, var(--primary-gold), var(--secondary-gold))", color: "var(--bg-dark)", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700 }}>
                  Generate Ticket
                </button>
              </div>
              {msg && <p style={{ color: "var(--accent-red)", fontSize: "13px", marginTop: "8px" }}>{msg}</p>}
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
              <div className="admin-row-tickets" style={{ padding: "16px 24px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", color: "#8a7a60", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>
                <span>Ticket</span><span>Client</span><span className="hide-sm">Days</span><span>Expires</span><span>Action</span>
              </div>
              {Object.entries(tickets).length === 0 && <p style={{ padding: "24px", color: "#4a3d20", textAlign: "center" }}>No tickets yet. Create one above.</p>}
              {Object.entries(tickets).reverse().map(([key, val]) => {
                const expired = isExpired(val.expiry);
                return (
                  <div key={key} className="admin-row-tickets" style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "center", opacity: expired ? 0.5 : 1 }}>
                    <span style={{ fontFamily: "monospace", color: "#f0d080", fontSize: "13px" }}>{key}</span>
                    <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{val.name}</span>
                    <span className="hide-sm" style={{ fontSize: "14px", color: "#8a7a60" }}>{val.days}d</span>
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
            <div className="admin-row-results" style={{ padding: "16px 24px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", color: "#8a7a60", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>
              <span className="hide-sm">Date</span><span>Client</span><span className="hide-sm">Ticket</span><span>Score</span><span>Result</span>
            </div>
            {results.length === 0 && <p style={{ padding: "24px", color: "#4a3d20", textAlign: "center" }}>No test results yet.</p>}
            {[...results].reverse().map((r, i) => (
              <div key={i} className="admin-row-results" style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", alignItems: "center" }}>
                <span className="hide-sm" style={{ fontSize: "12px", color: "#8a7a60" }}>{r.date}</span>
                <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{r.name}</span>
                <span className="hide-sm" style={{ fontFamily: "monospace", fontSize: "12px", color: "#f0d080" }}>{r.ticket}</span>
                <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{r.score}/{r.total} ({r.pct}%)</span>
                <span style={{ color: r.passed ? "#6bffb8" : "#ff6b6b", fontSize: "13px", fontWeight: 700 }}>{r.passed ? "PASS ✓" : "FAIL ✗"}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── QUESTIONS TAB ─────────────────────────────────────────────────── */}
        {tab === "questions" && (
          <div>
            {/* Delete confirmation modal */}
            {deleteConfirm && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,0.92)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
                <div style={{ background: "#1a2438", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "16px", padding: "32px", maxWidth: "400px", textAlign: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗑️</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--accent-red)", marginBottom: "10px" }}>Delete Question?</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", lineHeight: 1.5 }}>This action cannot be undone.</p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setDeleteConfirm(null)} className="btn" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", padding: "10px", borderRadius: "8px", fontSize: "14px" }}>Cancel</button>
                    <button onClick={() => confirmDelete(deleteConfirm)} className="btn" style={{ flex: 1, background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.4)", color: "var(--accent-red)", padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 700 }}>Delete</button>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
              <div ref={formRef} className="fade-in" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${editingId ? "rgba(201,168,76,0.4)" : "rgba(107,255,184,0.3)"}`, borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "var(--text-main)" }}>
                    {editingId ? "✏️ Edit Question" : "➕ Add New Question"}
                  </h3>
                  <button onClick={cancelForm} className="btn" style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", padding: "4px" }}>✕</button>
                </div>

                {/* Category */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Category</label>
                  <select value={qForm.category} onChange={e => setQForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "10px 14px", color: "var(--text-main)", fontSize: "14px" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Question text */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Question</label>
                  <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} placeholder="Enter the question text..." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "10px 14px", color: "var(--text-main)", fontSize: "14px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>

                {/* Options */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase" }}>Options &amp; Correct Answer</label>
                    {qForm.options.length < 4 && <button onClick={addOption} className="btn" style={{ background: "rgba(107,255,184,0.1)", border: "1px solid rgba(107,255,184,0.3)", color: "var(--accent-green)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}>+ Add Option</button>}
                  </div>
                  {qForm.options.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <input type="radio" id={`ans_${i}`} name="answer" checked={qForm.answer === i} onChange={() => setQForm(f => ({ ...f, answer: i }))} style={{ accentColor: "var(--primary-gold)", width: "16px", height: "16px", flexShrink: 0, cursor: "pointer" }} />
                      <label htmlFor={`ans_${i}`} style={{ color: qForm.answer === i ? "var(--secondary-gold)" : "var(--text-muted)", fontSize: "13px", width: "22px", flexShrink: 0, cursor: "pointer", fontWeight: 700 }}>{["A","B","C","D"][i]}</label>
                      <input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${["A","B","C","D"][i]}`} style={{ flex: 1, background: qForm.answer === i ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.06)", border: `1px solid ${qForm.answer === i ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "8px", padding: "9px 12px", color: qForm.answer === i ? "var(--secondary-gold)" : "var(--text-main)", fontSize: "14px" }} />
                      {qForm.options.length > 2 && <button onClick={() => removeOption(i)} className="btn" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "var(--accent-red)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }}>✕</button>}
                    </div>
                  ))}
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Select the radio button next to the correct answer.</p>
                </div>

                {/* Image */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Image (optional)</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <input value={qForm.image.startsWith("data:") ? "" : qForm.image} onChange={e => setQForm(f => ({ ...f, image: e.target.value }))} placeholder="Paste image URL (https://...)" style={{ flex: "1 1 200px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 12px", color: "var(--text-main)", fontSize: "14px" }} />
                    <label className="btn" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--secondary-gold)", padding: "9px 14px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      📁 Upload
                      <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: "none" }} />
                    </label>
                    {qForm.image && <button onClick={() => setQForm(f => ({ ...f, image: "" }))} className="btn" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "var(--accent-red)", padding: "9px 12px", borderRadius: "8px", fontSize: "13px" }}>Remove</button>}
                  </div>
                  {qForm.image && (
                    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", background: "rgba(0,0,0,0.3)", display: "inline-block" }}>
                      <img src={qForm.image} alt="Preview" style={{ maxHeight: "160px", maxWidth: "100%", display: "block", padding: "6px", objectFit: "contain" }} onError={() => setQMsg("Image URL cannot be loaded.")} />
                    </div>
                  )}
                </div>

                {qMsg && <p style={{ color: "var(--accent-red)", fontSize: "13px", marginBottom: "12px" }}>{qMsg}</p>}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={cancelForm} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", padding: "11px 20px", borderRadius: "8px", fontSize: "14px" }}>Cancel</button>
                  <button onClick={saveQuestion} className="btn" style={{ background: "linear-gradient(135deg, var(--primary-gold), var(--secondary-gold))", color: "var(--bg-dark)", padding: "11px 28px", borderRadius: "8px", fontSize: "14px", fontWeight: 700 }}>
                    {editingId ? "Save Changes" : "Add Question"}
                  </button>
                </div>
              </div>
            )}

            {/* Questions Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
                <button onClick={() => { setQSource("custom"); setQPage(1); }} className="btn" style={{ background: qSource === "custom" ? "rgba(201,168,76,0.2)" : "none", border: qSource === "custom" ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent", color: qSource === "custom" ? "var(--secondary-gold)" : "var(--text-muted)", padding: "6px 14px", borderRadius: "6px", fontSize: "13px" }}>
                  Custom ({customQuestions.length})
                </button>
                <button onClick={() => { setQSource("builtin"); setQPage(1); }} className="btn" style={{ background: qSource === "builtin" ? "rgba(201,168,76,0.2)" : "none", border: qSource === "builtin" ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent", color: qSource === "builtin" ? "var(--secondary-gold)" : "var(--text-muted)", padding: "6px 14px", borderRadius: "6px", fontSize: "13px" }}>
                  Built-in ({QUESTIONS_DB.length})
                </button>
              </div>
              {!showForm && (
                <button onClick={openAdd} className="btn" style={{ background: "linear-gradient(135deg, var(--primary-gold), var(--secondary-gold))", color: "var(--bg-dark)", padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}>+ Add Question</button>
              )}
            </div>

            {/* Search + Filter */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input value={qSearch} onChange={e => { setQSearch(e.target.value); setQPage(1); }} placeholder="Search questions..." style={{ flex: "1 1 200px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 14px", color: "var(--text-main)", fontSize: "14px" }} />
              <select value={qCatFilter} onChange={e => { setQCatFilter(e.target.value); setQPage(1); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 14px", color: "var(--text-main)", fontSize: "14px" }}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Questions List */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "12px", overflow: "hidden" }}>
              {pagedList.length === 0 && (
                <p style={{ padding: "32px", color: "#4a3d20", textAlign: "center" }}>
                  {qSource === "custom" ? "No custom questions yet. Add one above." : "No built-in questions match."}
                </p>
              )}
              {pagedList.map((q, i) => {
                const catColor = { "Road Signs": "var(--accent-green)", "Rules of the Road": "var(--secondary-gold)", "Vehicle Controls": "var(--accent-orange)" }[q.category] || "var(--text-muted)";
                const isExpanded = expandedQId === q.id;
                const isBuiltin = qSource === "builtin";
                return (
                  <div key={q.id ?? i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {/* Row header — clickable for all questions */}
                    <div
                      onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                      style={{ padding: "14px 20px", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer", transition: "background 0.15s", background: isExpanded ? "rgba(201,168,76,0.05)" : "transparent" }}
                    >
                      <span style={{ color: "#4a3d20", fontSize: "12px", minWidth: "28px", paddingTop: "2px" }}>#{(qPage - 1) * PAGE_SIZE + i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "4px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ background: `rgba(${catColor === "var(--accent-green)" ? "107,255,184" : catColor === "var(--secondary-gold)" ? "240,208,128" : "255,159,107"},0.1)`, color: catColor, border: `1px solid ${catColor}30`, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", letterSpacing: "1px", flexShrink: 0 }}>{q.category}</span>
                          {q.source === "custom" && <span style={{ background: "rgba(107,255,184,0.08)", color: "var(--accent-green)", border: "1px solid rgba(107,255,184,0.2)", borderRadius: "20px", padding: "2px 8px", fontSize: "10px" }}>Custom</span>}
                          {q.image && <span style={{ fontSize: "12px" }} title="Has image">🖼️</span>}
                        </div>
                        <p style={{ color: "var(--text-main)", fontSize: "14px", lineHeight: 1.4, margin: 0 }}>{q.question}</p>
                        {!isExpanded && <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>✓ {q.options[q.answer]}</p>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                        {!isBuiltin && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); openEdit(q); }} className="btn" title="Edit" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--secondary-gold)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(q.id); }} className="btn" title="Delete" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "var(--accent-red)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }}>🗑️</button>
                          </>
                        )}
                        <span style={{ color: "var(--text-muted)", fontSize: "12px", transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                      </div>
                    </div>

                    {/* Expanded panel — same for both custom and built-in */}
                    {isExpanded && (
                      <div style={{ padding: "0 20px 16px 60px", background: "rgba(201,168,76,0.03)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{ display: "flex", alignItems: "center", gap: "10px", background: oi === q.answer ? "rgba(107,255,184,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${oi === q.answer ? "rgba(107,255,184,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "8px", padding: "8px 12px" }}>
                              <span style={{ background: oi === q.answer ? "rgba(107,255,184,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${oi === q.answer ? "rgba(107,255,184,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0, color: oi === q.answer ? "var(--accent-green)" : "var(--text-muted)" }}>{["A","B","C","D"][oi]}</span>
                              <span style={{ fontSize: "13px", color: oi === q.answer ? "var(--accent-green)" : "var(--text-main)", flex: 1 }}>{opt}</span>
                              {oi === q.answer && <span style={{ fontSize: "11px", color: "var(--accent-green)", letterSpacing: "1px" }}>✓ CORRECT</span>}
                            </div>
                          ))}
                        </div>
                        {q.image && (
                          <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", background: "rgba(0,0,0,0.3)", display: "inline-block" }}>
                            <img src={q.image} alt="Question" style={{ maxHeight: "140px", maxWidth: "100%", display: "block", padding: "6px", objectFit: "contain" }} />
                          </div>
                        )}
                        {isBuiltin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openCopyBuiltin(q); setExpandedQId(null); }}
                            className="btn"
                            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "var(--secondary-gold)", padding: "8px 16px", borderRadius: "7px", fontSize: "13px", fontWeight: 600 }}
                          >
                            ✏️ Edit / Copy as Custom
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                <button onClick={() => setQPage(p => Math.max(1, p - 1))} disabled={qPage === 1} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", padding: "7px 14px", borderRadius: "6px", fontSize: "13px", opacity: qPage === 1 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Page {qPage} of {totalPages}</span>
                <button onClick={() => setQPage(p => Math.min(totalPages, p + 1))} disabled={qPage === totalPages} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", padding: "7px 14px", borderRadius: "6px", fontSize: "13px", opacity: qPage === totalPages ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminScreen;
