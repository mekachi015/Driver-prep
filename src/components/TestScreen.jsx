import { useState, useEffect, useRef, useCallback } from "react";
import { QUESTIONS_DB } from "../data/questions";
import { getResults, saveResults } from "../utils/storage";
import { shuffle } from "../utils/helpers";
import { PASS_MARK } from "../constants";


function TestScreen({ ticket, setScreen, setTestResult }) {
  const SESSION_KEY = `testSession_${ticket.number}`;

  const persistSession = useCallback((qs, ans, cur, endTime) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      questionIds: qs.map(q => q.id),
      answers: ans,
      current: cur,
      endTime,
    }));
  }, [SESSION_KEY]);

  // Compute initial session data once via a lazy useState initializer —
  // avoids calling setState inside an effect.
  const [initData] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (saved) {
      const reconstructed = saved.questionIds
        .map(id => QUESTIONS_DB.find(qq => qq.id === id))
        .filter(Boolean);
      if (reconstructed.length === 30) {
        const endTime = saved.endTime;
        return {
          questions: reconstructed,
          answers: saved.answers || {},
          current: saved.current || 0,
          timeLeft: Math.max(0, Math.floor((endTime - Date.now()) / 1000)),
          endTime,
        };
      }
    }
    const q = shuffle(QUESTIONS_DB).slice(0, 30);
    const endTime = Date.now() + 30 * 60 * 1000;
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      questionIds: q.map(qq => qq.id),
      answers: {},
      current: 0,
      endTime,
    }));
    return { questions: q, answers: {}, current: 0, timeLeft: 30 * 60, endTime };
  });

  const [questions] = useState(initData.questions);
  const [answers, setAnswers] = useState(initData.answers);
  const [current, setCurrent] = useState(initData.current);
  const [timeLeft, setTimeLeft] = useState(initData.timeLeft);
  const [showWarning, setShowWarning] = useState(false);

  const timerRef = useRef(null);
  const answersRef = useRef(initData.answers);
  const questionsRef = useRef(initData.questions);
  const submittedRef = useRef(false);
  const endTimeRef = useRef(initData.endTime);
  const timeLeftRef = useRef(initData.timeLeft);

  const submitTest = useCallback(async (forceSubmit = false) => {
    if (submittedRef.current) return;
    const qs = questionsRef.current;
    const ans = answersRef.current;

    if (!forceSubmit && Object.keys(ans).length < qs.length) {
      setShowWarning(true);
      return;
    }

    submittedRef.current = true;
    clearInterval(timerRef.current);
    localStorage.removeItem(SESSION_KEY);
    const score = qs.reduce((acc, q) => acc + (ans[q.id] === q.answer ? 1 : 0), 0);
    const pct = Math.round((score / qs.length) * 100);
    const passed = pct >= PASS_MARK;
    const result = { score, total: qs.length, pct, passed, questions: qs, answers: ans, ticket: ticket.number, name: ticket.name, date: new Date().toISOString().split("T")[0] };
    const prev = await getResults();
    await saveResults([...prev, { score, total: qs.length, pct, passed, ticket: ticket.number, name: ticket.name, date: result.date }]);
    setTestResult(result);
    setScreen("results");
  }, [SESSION_KEY, ticket, setTestResult, setScreen]);

  // Start the timer; setState and submitTest are called inside the interval
  // callback (not directly in the effect body), which is allowed.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0 && !submittedRef.current) {
        clearInterval(timerRef.current);
        submitTest(true);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submitTest]);

  // Persist session whenever answers or current question index change
  useEffect(() => {
    if (questionsRef.current.length > 0 && endTimeRef.current) {
      persistSession(questionsRef.current, answers, current, endTimeRef.current);
    }
  }, [answers, current, persistSession]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const progress = Object.keys(answers).length / (questions.length || 1);
  const q = questions[current];

  if (!q) return <div style={{ padding: "40px", textAlign: "center", color: "#f0d080" }}>Loading questions...</div>;

  const unansweredCount = questions.length - Object.keys(answers).length;

  const catColors = { "Road Signs": "#6bffb8", "Rules of the Road": "#f0d080", "Vehicle Controls": "#ff9f6b" };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", maxWidth: "780px", margin: "0 auto" }}>
      {/* Warning Modal */}
      {showWarning && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0e1428", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "16px", padding: "36px 40px", maxWidth: "420px", width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f0d080", fontSize: "20px", marginBottom: "12px" }}>Not All Questions Answered</h3>
            <p style={{ color: "#b0a080", fontSize: "15px", lineHeight: 1.6, marginBottom: "8px" }}>
              You have <strong style={{ color: "#ff9f6b" }}>{unansweredCount}</strong> unanswered {unansweredCount === 1 ? "question" : "questions"} remaining.
            </p>
            <p style={{ color: "#8a7a60", fontSize: "13px", marginBottom: "28px" }}>Please answer all 30 questions before submitting.</p>
            <button
              onClick={() => setShowWarning(false)}
              className="btn"
              style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)", color: "#0a0f1e", padding: "12px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: 700 }}
            >
              Continue Test
            </button>
          </div>
        </div>
      )}
      <div className="fade-in">
        {/* Top Bar */}
        <div className="test-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#f0d080" }}>Practice Test</h2>
            <p style={{ fontSize: "13px", color: "#8a7a60" }}>Welcome, {ticket.name}</p>
          </div>
          <div className="test-topbar-counters" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "19px", lineHeight: 1.6, color: "#e8dcc8", marginBottom: q.image ? "20px" : "28px" }}>{q.question}</p>

          {q.image && (
            <div style={{ marginBottom: "24px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.25)", background: "rgba(0,0,0,0.3)" }}>
              <img
                src={q.image}
                alt="Vehicle controls diagram"
                style={{ width: "100%", maxHeight: "320px", objectFit: "contain", display: "block", padding: "12px" }}
              />
              <div style={{ padding: "6px 12px 8px", fontSize: "11px", color: "#8a7a60", letterSpacing: "1px", textTransform: "uppercase", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
                Vehicle Controls Diagram — refer to this image to answer the question
              </div>
            </div>
          )}

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
          <button onClick={() => submitTest()} className="btn" style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)", color: "#0a0f1e", padding: "12px 28px", borderRadius: "8px", fontSize: "15px", fontWeight: 700 }}>
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

export default TestScreen;