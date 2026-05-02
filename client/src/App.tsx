import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import CircularProgress from './components/CircularProgress';

const API_BASE = 'http://localhost:3002/api';

const Login = () => (
  <div className="login-full-screen">
    <h1>WHOOP Intelligence</h1>
    <p style={{ marginBottom: '30px' }}>Unlock elite-level physiological insights from your WHOOP data.</p>
    <a href="http://localhost:3002/auth" className="login-button">Connect with WHOOP</a>
  </div>
);

const MetricRow = ({ label, value }: { label: string, value: string | number }) => (
  <div className="metric-row">
    <span className="metric-label">{label}</span>
    <span className="metric-value">{value}</span>
  </div>
);

const ChatPanel = ({ userData }: { userData: any }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Hello ${userData.profile?.first_name}! I'm your WHOOP Performance Coach. Ask me anything about your recovery, strain, or sleep.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: userMsg,
        history: messages,
        userData: userData
      });
      setMessages(prev => [...prev, { role: 'ai', content: response.data.reply }]);
    } catch (err: any) {
      const detail = err.response?.data?.details || err.message;
      const code = err.response?.data?.code || "N/A";
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `Coach Error: ${detail} (Code: ${code}). Please verify your Gemini API key in .env and ensure the backend was restarted.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-header">
        <h3>Performance Coach</h3>
        <p>Powered by Google Gemini</p>
      </div>
      <div className="messages-container">
        {messages.map((m, i) => <div key={i} className={`message ${m.role}`}>{m.content}</div>)}
        {loading && <div className="message ai">Analyzing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input className="chat-input" placeholder="Ask your coach..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
        <button className="send-btn" onClick={handleSend} disabled={loading}>➜</button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'workouts'>('overview');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [data, setData] = useState<any>({ profile: null, body: null, recovery: [], sleep: [], cycles: [], workouts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('whoop_token');
      if (token) {
        localStorage.setItem('whoop_token', token);
        window.history.replaceState({}, document.title, "/dashboard");
      } else {
        setError('No access token.');
        setLoading(false);
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const end = new Date().toISOString();
        const start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const params = { start, end, limit: 25 };

        const [p, b, r, s, c, w] = await Promise.all([
          axios.get(`${API_BASE}/profile`, config), axios.get(`${API_BASE}/body`, config),
          axios.get(`${API_BASE}/recovery`, { ...config, params }), axios.get(`${API_BASE}/sleep`, { ...config, params }),
          axios.get(`${API_BASE}/cycles`, { ...config, params }), axios.get(`${API_BASE}/workout`, { ...config, params }),
        ]);

        setData({ profile: p.data, body: b.data, recovery: r.data.records, sleep: s.data.records, cycles: c.data.records, workouts: w.data.records });
        setLoading(false);
      } catch (err: any) {
        if (err.response?.status === 401) localStorage.removeItem('whoop_token');
        setError('Auth failed.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latest = useMemo(() => ({ recovery: data.recovery[0], sleep: data.sleep[0], cycle: data.cycles[0], workout: data.workouts[0] }), [data]);
  const msToTime = (ms: number) => { const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000); return `${h}h ${m}m`; };
  const trendData = useMemo(() => [...data.cycles].reverse().map(cycle => ({ date: new Date(cycle.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }), strain: cycle.score?.strain || 0, recovery: data.recovery.find((r: any) => r.cycle_id === cycle.id)?.score?.recovery_score || 0, hrv: data.recovery.find((r: any) => r.cycle_id === cycle.id)?.score?.hrv_rmssd_milli || 0, sleep: data.sleep.find((s: any) => s.cycle_id === cycle.id)?.score?.sleep_performance_percentage || 0, rhr: data.recovery.find((r: any) => r.cycle_id === cycle.id)?.score?.resting_heart_rate || 0 })), [data]);
  const sleepStages = useMemo(() => { const s = latest.sleep?.score?.stage_summary; return s ? [{ name: 'Light', value: s.total_light_sleep_time_milli }, { name: 'REM', value: s.total_rem_sleep_time_milli }, { name: 'Deep', value: s.total_slow_wave_sleep_time_milli }, { name: 'Awake', value: s.total_awake_time_milli }] : []; }, [latest.sleep]);

  if (loading) return <div className="login-full-screen"><h1>Analyzing...</h1></div>;
  if (error) return <div className="login-full-screen"><h1>{error}</h1><a href="/" className="login-button">Retry</a></div>;

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="dashboard-container">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>{data.profile?.first_name} {data.profile?.last_name}</h1>
              <div className="profile-stats">
                <span className="stat-pill">{data.body?.weight_kilogram.toFixed(1)} kg</span>
                <span className="stat-pill">{Math.round(data.body?.height_meter * 100)} cm</span>
                <span className="stat-pill">Max HR: {data.body?.max_heart_rate}</span>
              </div>
            </div>
            <button className="tab" onClick={() => { localStorage.removeItem('whoop_token'); navigate('/'); }}>Logout</button>
          </header>

          <div className="tabs">
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`tab ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')}>Trends</button>
            <button className={`tab ${activeTab === 'workouts' ? 'active' : ''}`} onClick={() => setActiveTab('workouts')}>Workouts</button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="dashboard-grid">
                <div className={`main-card ${activeCard === 'recovery' ? 'active' : ''}`} onClick={() => setActiveCard(activeCard === 'recovery' ? null : 'recovery')}>
                  <h2>Recovery</h2>
                  <CircularProgress value={latest.recovery?.score?.recovery_score || 0} color={latest.recovery?.score?.recovery_score > 66 ? '#4CAF50' : '#FFEB3B'} label={`${latest.recovery?.score?.recovery_score || 0}%`} />
                  <div className="metrics-container"><MetricRow label="HRV" value={`${latest.recovery?.score?.hrv_rmssd_milli || 0} ms`} /><MetricRow label="RHR" value={`${latest.recovery?.score?.resting_heart_rate || 0} bpm`} /></div>
                </div>
                <div className={`main-card ${activeCard === 'strain' ? 'active' : ''}`} onClick={() => setActiveCard(activeCard === 'strain' ? null : 'strain')}>
                  <h2>Strain</h2>
                  <CircularProgress value={latest.cycle?.score?.strain || 0} max={21} color="#FF9800" label={(latest.cycle?.score?.strain || 0).toFixed(1)} />
                  <div className="metrics-container"><MetricRow label="Avg HR" value={`${latest.cycle?.score?.average_heart_rate || 0} bpm`} /><MetricRow label="KJ" value={Math.round(latest.cycle?.score?.kilojoule || 0)} /></div>
                </div>
                <div className={`main-card ${activeCard === 'sleep' ? 'active' : ''}`} onClick={() => setActiveCard(activeCard === 'sleep' ? null : 'sleep')}>
                  <h2>Sleep</h2>
                  <CircularProgress value={latest.sleep?.score?.sleep_performance_percentage || 0} color="#2196F3" label={`${latest.sleep?.score?.sleep_performance_percentage || 0}%`} />
                  <div className="metrics-container"><MetricRow label="Efficiency" value={`${latest.sleep?.score?.sleep_efficiency_percentage?.toFixed(1) || 0}%`} /><MetricRow label="In Bed" value={msToTime(latest.sleep?.score?.stage_summary?.total_in_bed_time_milli || 0)} /></div>
                </div>
              </div>
              {activeCard && (
                <div className="detailed-insights-panel">
                  {activeCard === 'recovery' && <div className="insights-content"><div style={{ height: 250 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><XAxis dataKey="date" hide /><YAxis hide /><Tooltip contentStyle={{ background: '#111', border: 'none' }} /><Area type="monotone" dataKey="hrv" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div><div className="metrics-container"><MetricRow label="Skin Temp" value={`${latest.recovery?.score?.skin_temp_celsius || 'N/A'} °C`} /><MetricRow label="SpO2" value={`${latest.recovery?.score?.spo2_percentage || 'N/A'}%`} /><MetricRow label="Avg HRV" value={`${Math.round(trendData.reduce((a,b)=>a+b.hrv,0)/trendData.length)} ms`} /></div></div>}
                  {activeCard === 'strain' && <div className="insights-content"><div style={{ height: 250 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData}><XAxis dataKey="date" hide /><YAxis hide /><Tooltip contentStyle={{ background: '#111', border: 'none' }} /><Bar dataKey="strain" fill="#FF9800" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="metrics-container"><MetricRow label="Max HR" value={`${latest.cycle?.score?.max_heart_rate || 0} bpm`} /><MetricRow label="Calories" value={`${Math.round(latest.cycle?.score?.kilojoule / 4.184)} kcal`} /><MetricRow label="Duration" value={msToTime(latest.cycle?.score?.active_duration_milli || 0)} /></div></div>}
                  {activeCard === 'sleep' && <div className="insights-content"><div style={{ height: 250 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sleepStages} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">{sleepStages.map((e, i) => <Cell key={i} fill={['#2196F3', '#64B5F6', '#1565C0', '#424242'][i % 4]} />)}</Pie><Tooltip formatter={(v: number) => msToTime(v)} contentStyle={{ background: '#111', border: 'none' }} /></PieChart></ResponsiveContainer></div><div className="metrics-container"><MetricRow label="Resp. Rate" value={`${latest.sleep?.score?.respiratory_rate?.toFixed(2)} rpm`} /><MetricRow label="Baseline" value={msToTime(latest.sleep?.score?.sleep_needed?.baseline_milli || 0)} /><MetricRow label="Debt" value={msToTime(latest.sleep?.score?.sleep_needed?.need_from_sleep_debt_milli || 0)} /></div></div>}
                </div>
              )}
            </>
          )}

          {activeTab === 'trends' && <div className="chart-card"><h2>14-Day Performance</h2><div style={{ height: 350 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} /><XAxis dataKey="date" stroke="#666" /><YAxis stroke="#666" /><Tooltip contentStyle={{ background: '#111', border: 'none' }} /><Legend /><Area name="Recovery %" type="monotone" dataKey="recovery" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.1} /><Line name="Strain" type="monotone" dataKey="strain" stroke="#FF9800" strokeWidth={3} /></AreaChart></ResponsiveContainer></div></div>}
          {activeTab === 'workouts' && <div className="workout-list"><h2>Recent Activities</h2>{data.workouts.map((w: any) => (<div key={w.id} className="workout-item"><div className="workout-info"><h4>Activity</h4><p>{new Date(w.start).toLocaleDateString()} • {Math.round((new Date(w.end).getTime() - new Date(w.start).getTime())/60000)} mins</p></div><div className="workout-stats"><div className="workout-strain">{w.score?.strain.toFixed(1)}</div><p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>STRAIN</p></div></div>))}</div>}
        </div>
      </div>
      <ChatPanel userData={{ ...data, latest }} />
    </div>
  );
};

const App = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
);

export default App;
