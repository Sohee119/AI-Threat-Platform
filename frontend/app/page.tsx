"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Activity, Server, RefreshCw, CheckCircle2, Lock, Ban } from "lucide-react";
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
  const [anomalyRatio, setAnomalyRatio] = useState(0);
  const [highSeverity, setHighSeverity] = useState(0);
  const [mediumSeverity, setMediumSeverity] = useState(0);
  const [blockedIPsCount, setBlockedIPsCount] = useState(0);
  const [topEndpoints, setTopEndpoints] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const BACKEND_URL = "https://ai-threat-platform.onrender.com";

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`);
      const data = await res.json();
      setTotalScanned(data.total_requests_scanned);
      setTotalThreats(data.total_threats_detected);
      setAnomalyRatio(data.anomaly_ratio || 0);
      setHighSeverity(data.high_severity_count || 0);
      setMediumSeverity(data.medium_severity_count || 0);
      setBlockedIPsCount(data.blocked_ips_count || 0);
      setTopEndpoints(data.top_endpoints || {});
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
    setActionMessage(null);
    const mockPayload = {
      ip_address: isThreat ? "203.0.113.42" : "192.168.1.55",
      endpoint: isThreat ? "/api/admin/dump" : "/api/profile",
      status_code: isThreat ? 500 : 200,
      payload_size: isThreat ? 35000 : 450,
      duration_ms: isThreat ? 1200 : 35,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPayload),
      });
      
      if (res.status === 403) {
        setActionMessage("Warning: Request blocked because the source IP is isolated.");
      }
      
      await fetchDashboardData();
    } catch (err) {
      console.error("Error sending simulation log:", err);
    }
    setSimulating(false);
  };

  // Isolate / Block an IP address
  const handleBlockIp = async (ipAddress: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/block-ip?ip_address=${encodeURIComponent(ipAddress)}`, {
        method: "POST",
      });
      const data = await res.json();
      setActionMessage(data.message);
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to block IP:", err);
    }
  };

  // Chart data formatting for traffic distribution
  const chartData = [
    { name: "Normal Traffic", count: totalScanned - totalThreats },
    { name: "Flagged Threats", count: totalThreats },
  ];

  // Endpoint chart data format
  const endpointChartData = Object.keys(topEndpoints).map((ep) => ({
    endpoint: ep,
    count: topEndpoints[ep],
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Cloud Threat Intelligence</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Real-time Isolation Forest Anomaly Detection Engine & SOC</p>
        </div>
        <div className="flex gap-3 flex-wrap">
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

      {actionMessage && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs text-amber-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Requests Scanned</p>
          <h3 className="text-2xl font-bold text-white mt-1">{totalScanned.toLocaleString()}</h3>
          <span className="text-xs text-cyan-400 mt-2 block">Live Telemetry Active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Anomaly Ratio</p>
          <h3 className="text-2xl font-bold text-cyan-400 mt-1">{anomalyRatio}%</h3>
          <span className="text-xs text-slate-500 mt-2 block">Outlier percentage</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">High Severity</p>
          <h3 className="text-2xl font-bold text-rose-500 mt-1">{highSeverity}</h3>
          <span className="text-xs text-rose-400/80 mt-2 block">Large payload attacks</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Medium Severity</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1">{mediumSeverity}</h3>
          <span className="text-xs text-amber-400/80 mt-2 block">Suspicious headers/latencies</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Isolated IPs</p>
          <h3 className="text-2xl font-bold text-purple-400 mt-1">{blockedIPsCount}</h3>
          <span className="text-xs text-purple-400/80 mt-2 block">Blocked at firewall</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Traffic vs Threat Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
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

        {/* Top Targeted Endpoints Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Top Targeted Endpoints</h2>
          <div className="h-64 w-full">
            {endpointChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No endpoint attack targets recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={endpointChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="endpoint" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
                  <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Live Security Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-200">Live Security Threat Feed</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time isolation forest alert stream with active IP mitigation options</p>
          </div>
          <button onClick={fetchDashboardData} className="text-slate-400 hover:text-white transition flex items-center gap-1 text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
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
                <th className="p-4">Payload (B)</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No threats detected yet. Click <span className="text-rose-400 font-semibold">"Simulate Attack Log"</span> to test the anomaly detector!
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
                    <td className="p-4 font-mono text-slate-300">{alert.duration_ms}ms</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleBlockIp(alert.ip_address)}
                        className="inline-flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-lg text-xs font-medium transition"
                        title="Isolate and block this IP address"
                      >
                        <Ban className="w-3.5 h-3.5" /> Isolate IP
                      </button>
                    </td>
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