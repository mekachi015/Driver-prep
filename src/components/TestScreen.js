import { useState, useEffect, useRef } from "react";
import { QUESTIONS_DB } from "../data/questions";
import { getResults, saveResults } from "../utils/storage";
import { shuffle } from "../utils/helpers";


function TestScreen({ ticket, setScreen, setTestResult }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const timerRef = useRef(null);
  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    const q = shuffle(QUESTIONS_DB).slice(0, 30);
    setQuestions(q);
    questionsRef.current = q;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !submittedRef.current) {
      handleSubmit(questionsRef.current, answersRef.current);
    }
  }, [timeLeft]);

  const handleSubmit = async (qs = questionsRef.current, ans = answersRef.current) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    clearInterval(timerRef.current);
    const score = qs.reduce((acc, q) => acc + (ans[q.id] === q.answer ? 1 : 0), 0);
    const pct = Math.round((score / qs.length) * 100);
    const passed = pct >= 75;
    const result = { score, total: qs.length, pct, passed, questions: qs, answers: ans, ticket: ticket.number, name: ticket.name, date: new Date().toISOString().split("T")[0] };
    const prev = await getResults();
    await saveResults([...prev, { score, total: qs.length, pct, passed, ticket: ticket.number, name: ticket.name, date: result.date }]);
    setTestResult(result);
    setScreen("results");
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const progress = Object.keys(answers).length / (questions.length || 1);
  const q = questions[current];

  if (!q) return <div style={{ padding: "40px", textAlign: "center", color: "#f0d080" }}>Loading questions...</div>;

  const catColors = { "Road Signs": "#6bffb8", "Rules of the Road": "#f0d080", "Vehicle Controls": "#ff9f6b" };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", maxWidth: "780px", margin: "0 auto" }}>
      <div className="fade-in">
        {/* Top Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#f0d080" }}>Practice Test</h2>
            <p style={{ fontSize: "13px", color: "#8a7a60" }}>Welcome, {ticket.name}</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ background: timeLeft < 300 ? "rgba(255,107,107,0.15)" : "rgba(201,168,76,0.1)", border: `1px solid ${timeLeft < 300 ? "rgba(255,107,107,0.4)" : "rgba(201,168,76,0.3)"}`, borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: "20px", color: timeLeft < 300 ? "#ff6b6b" : "#f0d080", animation: timeLeft < 60 ? "pulse 1s infinite" : "none" }}>{mm}:{ss}</div>
              <div style={{ fontSize: "10px", color: "#8a7a60", letterSpacing: "1px" }}>REMAINING</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", color: "#f0d080" }}>{Object.keys(answers).length}<span style={{ color: "#4a3d20" }}>/{questions.length}</span></div>
              <div style={{ fontSize: "10px", color: "#8a7a60", letterSpacing: "1px" }}>ANSWERED</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "4px", marginBottom: "24px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress * 100}%`, background: "linear-gradient(90deg, #c9a84c, #f0d080)", borderRadius: "4px", transition: "width 0.3s" }} />
        </div>

        {/* Question */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "32px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <span style={{ background: `rgba(${catColors[q.category] === "#6bffb8" ? "107,255,184" : catColors[q.category] === "#f0d080" ? "240,208,128" : "255,159,107"},0.1)`, color: catColors[q.category], border: `1px solid ${catColors[q.category]}40`, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", letterSpacing: "1px" }}>{q.category}</span>
            <span style={{ color: "#4a3d20", fontSize: "13px" }}>Q{current + 1} of {questions.length}</span>
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "19px", lineHeight: 1.6, color: "#e8dcc8", marginBottom: "28px" }}>{q.question}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              const labels = ["A", "B", "C", "D"];
              return (
                <button key={i} onClick={() => setAnswers(a => { const next = { ...a, [q.id]: i }; answersRef.current = next; return next; })} className="btn" style={{ background: selected ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: "10px", padding: "14px 18px", textAlign: "left", color: selected ? "#f0d080" : "#e8dcc8", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ background: selected ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${selected ? "#c9a84c" : "rgba(255,255,255,0.1)"}`, borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{labels[i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#8a7a60", padding: "10px 18px", borderRadius: "8px", fontSize: "14px", opacity: current === 0 ? 0.4 : 1 }}>← Prev</button>
            <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#8a7a60", padding: "10px 18px", borderRadius: "8px", fontSize: "14px", opacity: current === questions.length - 1 ? 0.4 : 1 }}>Next →</button>
          </div>
          <button onClick={() => handleSubmit()} className="btn" style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)", color: "#0a0f1e", padding: "12px 28px", borderRadius: "8px", fontSize: "15px", fontWeight: 700 }}>
            Submit Test →
          </button>
        </div>

        {/* Question Grid */}
        <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {questions.map((q2, i) => (
            <button key={i} onClick={() => setCurrent(i)} className="btn" style={{ width: "36px", height: "36px", borderRadius: "6px", background: i === current ? "rgba(201,168,76,0.3)" : answers[q2.id] !== undefined ? "rgba(107,255,184,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${i === current ? "#c9a84c" : answers[q2.id] !== undefined ? "rgba(107,255,184,0.3)" : "rgba(255,255,255,0.08)"}`, color: i === current ? "#f0d080" : answers[q2.id] !== undefined ? "#6bffb8" : "#4a3d20", fontSize: "12px", fontWeight: 700 }}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}