import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import AdminScreen from "./components/AdminScreen";
import TestScreen from "./components/TestScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const [screen, setScreen] = useState("home"); // home | admin | test | results
  const [currentTicket, setCurrentTicket] = useState(null);
  const [testResult, setTestResult] = useState(null);

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: "100vh", background: "#0a0f1e", color: "#e8dcc8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; }
        .btn { cursor: pointer; border: none; transition: all 0.2s; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        input, select { outline: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #c9a84c; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @media (max-width: 640px) {
          .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .admin-header-right { flex-wrap: wrap !important; }
          .ticket-form { flex-direction: column !important; }
          .admin-row-tickets { grid-template-columns: 1fr 1fr 1fr auto !important; }
          .admin-row-results { grid-template-columns: 1fr 1fr 1fr !important; }
          .hide-sm { display: none !important; }
          .test-topbar { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .test-topbar-counters { width: 100% !important; }
        }
      `}</style>

      {screen === "home" && <HomeScreen setScreen={setScreen} setCurrentTicket={setCurrentTicket} />}
      {screen === "admin" && <AdminScreen setScreen={setScreen} />}
      {screen === "test" && <TestScreen ticket={currentTicket} setScreen={setScreen} setTestResult={setTestResult} />}
      {screen === "results" && <ResultsScreen result={testResult} setScreen={setScreen} />}
    </div>
  );
}
