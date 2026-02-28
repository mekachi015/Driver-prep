import { useState, useEffect } from "react";
import { PASS_MARK } from "../constants";

function ResultsScreen({ result, setScreen }) {
  const [showReview, setShowReview] = useState(false);
  useEffect(() => { if (!result) setScreen("home"); }, [result]);
  if (!result) return null;

  const { score, total, pct, passed, questions, answers } = result;
  const byCategory = {};
  questions.forEach(q => {
    if (!byCategory[q.category]) byCategory[q.category] = { correct: 0, total: 0 };
    byCategory[q.category].total++;
    if (answers[q.id] === q.answer) byCategory[q.category].correct++;
  });

  return (
    <div style={{ minHeight: "100vh", padding: "24px", maxWidth: "780px", margin: "0 auto" }}>
      <div className="fade-in">
        {/* Result Card */}
        <div style={{ background: passed ? "rgba(107,255,184,0.06)" : "rgba(255,107,107,0.06)", border: `1px solid ${passed ? "rgba(107,255,184,0.3)" : "rgba(255,107,107,0.3)"}`, borderRadius: "20px", padding: "40px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>{passed ? "🏆" : "📚"}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "40px", color: passed ? "#6bffb8" : "#ff6b6b", marginBottom: "8px" }}>{passed ? "PASS" : "FAIL"}</h1>
          <div style={{ fontSize: "56px", fontWeight: 900, color: "#f0d080", lineHeight: 1, marginBottom: "8px" }}>{pct}%</div>
          <div style={{ color: "#8a7a60", fontSize: "16px" }}>Score: {score} / {total} correct</div>
          <div style={{ color: "#8a7a60", fontSize: "13px", marginTop: "8px" }}>Pass mark: {PASS_MARK}% &nbsp;·&nbsp; {passed ? "Well done!" : `You need ${PASS_MARK}% to pass. Keep practising!`}</div>
        </div>

        {/* Category Breakdown */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#e8dcc8", marginBottom: "20px" }}>Performance by Category</h3>
          {Object.entries(byCategory).map(([cat, data]) => {
            const cpct = Math.round((data.correct / data.total) * 100);
            return (
              <div key={cat} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", color: "#e8dcc8" }}>{cat}</span>
                  <span style={{ fontSize: "14px", color: cpct >= PASS_MARK ? "#6bffb8" : "#ff6b6b" }}>{data.correct}/{data.total} ({cpct}%)</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${cpct}%`, background: cpct >= PASS_MARK ? "linear-gradient(90deg,#6bffb8,#4dcca0)" : "linear-gradient(90deg,#ff6b6b,#ff4040)", borderRadius: "4px", transition: "width 0.6s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button onClick={() => setShowReview(!showReview)} className="btn" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8dcc8", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
            {showReview ? "Hide" : "Review"} Answers
          </button>
          <button onClick={() => setScreen("test")} className="btn" style={{ flex: 1, background: "linear-gradient(135deg, #c9a84c, #f0d080)", color: "#0a0f1e", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 700 }}>
            Take Another Test →
          </button>
          <button onClick={() => setScreen("home")} className="btn" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8a7a60", padding: "12px 20px", borderRadius: "8px", fontSize: "14px" }}>
            Logout
          </button>
        </div>

        {/* Review */}
        {showReview && (
          <div className="fade-in">
            {questions.map((q, i) => {
              const correct = answers[q.id] === q.answer;
              return (
                <div key={q.id} style={{ background: correct ? "rgba(107,255,184,0.04)" : "rgba(255,107,107,0.04)", border: `1px solid ${correct ? "rgba(107,255,184,0.15)" : "rgba(255,107,107,0.15)"}`, borderRadius: "10px", padding: "18px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ color: correct ? "#6bffb8" : "#ff6b6b", fontWeight: 700 }}>{i + 1}.</span>
                    <p style={{ color: "#e8dcc8", fontSize: "14px", lineHeight: 1.5 }}>{q.question}</p>
                  </div>
                  {q.image && (
                    <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", background: "rgba(0,0,0,0.3)" }}>
                      <img src={q.image} alt="Vehicle controls diagram" style={{ width: "100%", maxHeight: "220px", objectFit: "contain", display: "block", padding: "8px" }} />
                    </div>
                  )}
                  {q.options.map((opt, j) => {
                    const isCorrectOpt = j === q.answer;
                    const isUserChoice = j === answers[q.id];
                    return (
                      <div key={j} style={{ padding: "6px 10px", borderRadius: "6px", marginBottom: "4px", background: isCorrectOpt ? "rgba(107,255,184,0.1)" : isUserChoice && !isCorrectOpt ? "rgba(255,107,107,0.1)" : "transparent", color: isCorrectOpt ? "#6bffb8" : isUserChoice && !isCorrectOpt ? "#ff6b6b" : "#4a3d20", fontSize: "13px", display: "flex", gap: "8px" }}>
                        <span>{["A","B","C","D"][j]}.</span>
                        <span>{opt}</span>
                        {isCorrectOpt && <span style={{ marginLeft: "auto" }}>✓ Correct</span>}
                        {isUserChoice && !isCorrectOpt && <span style={{ marginLeft: "auto" }}>✗ Your answer</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsScreen;