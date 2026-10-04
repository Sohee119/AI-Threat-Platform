"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Activity, Server, RefreshCw, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Alert {
  id: number;
  ip_address: string;
  endpoint: string;
  status_code: number;
  payload_size: number;
  duration_ms: number;
  severity: string;
  message: string;
}

export default function ThreatDashboard() {
  const [totalScanned, setTotalScanned] = useState(5000);
  const [totalThreats, setTotalThreats] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const BACKEND_URL = "http://127.0.0.1:8000";

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`);
      const data = await res.json();
      setTotalScanned(data.total_requests_scanned);
      setTotalThreats(data.total_threats_detected);
      setAlerts(data.alerts);
    } catch (err) {
      console.error("Failed to connect to backend API:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Simulate incoming test log (Normal or Threat)
  const simulateLog = async (isThreat: boolean) => {
    setSimulating(true);
    const mockPayload = {
      ip_address: isThreat ? "203.0.113.42" : "192.168.1.55",
      endpoint: isThreat ? "/api/admin/dump" : "/api/profile",
      status_code: isThreat ? 500 : 200,
      payload_size: isThreat ? 35000 : 450,
      duration_ms: isThreat ? 1200 : 35,
    };

    try {
      await fetch(`${BACKEND_URL}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPayload),
      });
      await fetchDashboardData();
    } catch (err) {
      console.error("Error sending simulation log:", err);
    }
    setSimulating(false);
  };

  // Chart data formatting
  const chartData = [
    { name: "Normal Traffic", count: totalScanned - totalThreats },
    { name: "Flagged Threats", count: totalThreats },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Cloud Threat Intelligence</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Real-time Isolation Forest Anomaly Detection Engine</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => simulateLog(false)}
            disabled={simulating}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Simulate Normal Log
          </button>
          <button
            onClick={() => simulateLog(true)}
            disabled={simulating}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" /> Simulate Attack Log
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Total Requests Scanned</p>
            <h3 className="text-3xl font-bold text-white mt-1">{totalScanned.toLocaleString()}</h3>
          </div>
          <Server className="w-10 h-10 text-cyan-500 opacity-80" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Active Security Threats</p>
            <h3 className="text-3xl font-bold text-rose-500 mt-1">{totalThreats}</h3>
          </div>
          <AlertTriangle className="w-10 h-10 text-rose-500 opacity-80" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">System Status</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> Protected
            </h3>
          </div>
          <Activity className="w-10 h-10 text-emerald-500 opacity-80" />
        </div>
      </div>

      {/* Chart & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Traffic vs Threat Distribution</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-slate-200">AI Engine Status</h2>
            <p className="text-sm text-slate-400 mb-4">
              Running scikit-learn Isolation Forest algorithm. Models analyze incoming telemetry vectors for outliers based on payload size, latency, and status codes.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-cyan-400">
            [INFO] Model loaded: anomaly_detector.pkl <br />
            [INFO] Contamination rate: 2% <br />
            [STATUS] Real-time inference active
          </div>
        </div>
      </div>

      {/* Live Security Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-200">Live Security Threat Feed</h2>
          <button onClick={fetchDashboardData} className="text-slate-400 hover:text-white transition flex items-center gap-1 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-xs tracking-wider">
                <th className="p-4">Severity</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Target Endpoint</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payload (Bytes)</th>
                <th className="p-4">Duration (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No threats detected yet. Click "Simulate Attack Log" to test the AI model!
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-850 transition">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${alert.severity === "HIGH" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-cyan-300">{alert.ip_address}</td>
                    <td className="p-4 text-slate-300">{alert.endpoint}</td>
                    <td className="p-4 font-mono text-slate-400">{alert.status_code}</td>
                    <td className="p-4 font-mono text-slate-300">{alert.payload_size}</td>
                    <td className="p-4 font-mono text-slate-300">{alert.duration_ms}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}