import { useState, useEffect } from "react";
import api from "../services/api";

const TYPE_CONFIG = {
  HospitalOrganAllocated:       { label: "Organ Allocated",      color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  HospitalOrganStatusUpdated:   { label: "Status Updated",       color: "bg-blue-50 text-blue-700 border-blue-200" },
  DonorRegistered:              { label: "Donor Registered",     color: "bg-purple-50 text-purple-700 border-purple-200" },
  RecipientRegistered:          { label: "Recipient Registered", color: "bg-amber-50 text-amber-700 border-amber-200" },
  OrganAllocated:               { label: "Smart Allocation",     color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  OrganStatusUpdated:           { label: "Organ Status",         color: "bg-gray-50 text-gray-700 border-gray-200" },
  TransplantCompleted:          { label: "Transplant Done",      color: "bg-teal-50 text-teal-700 border-teal-200" },
  OrganListed:                  { label: "Organ Listed",         color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function TransactionHistory() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/blockchain/transactions")
      .then((r) => setTxs(r.data))
      .catch((e) => setError(e.response?.data?.message || "Failed to fetch transactions"))
      .finally(() => setLoading(false));
  }, []);

  const types = ["All", ...Object.keys(TYPE_CONFIG)];
  const filtered = filter === "All" ? txs : txs.filter((t) => t.type === filter);
  const counts = Object.keys(TYPE_CONFIG).reduce((acc, k) => { acc[k] = txs.filter((t) => t.type === k).length; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Blockchain Transaction Audit</h1>
        <p className="page-subtitle">All immutable blockchain events fetched via ethers.js event logs</p>
      </div>

      {/* Live Banner */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-white font-semibold text-sm mb-1">Live Blockchain Monitoring</div>
          <p className="text-gray-400 text-xs max-w-xl">
            Real-time tracking of all blockchain transactions. Every donor registration, organ allocation, and transplant completion is permanently recorded on Ethereum.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-6">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-emerald-300 text-xs font-medium">Live from Ethereum</span>
          </div>
          <button onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-white/10">
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`border rounded-xl p-4 ${cfg.color}`}>
            <div className="text-xl font-bold">{counts[key] || 0}</div>
            <div className="text-xs mt-1 font-medium leading-tight">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "All" ? `All (${txs.length})` : `${TYPE_CONFIG[t]?.label} (${counts[t] || 0})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Transaction Records</h3>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400">Live from Ethereum</span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <svg className="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span className="text-gray-500 text-sm">Fetching blockchain events...</span>
          </div>
        )}

        {error && <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{["Event Type", "Transaction Hash", "Block", "Timestamp", "Details"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const cfg = TYPE_CONFIG[tx.type] || { label: tx.type, color: "bg-gray-100 text-gray-600 border-gray-200" };
                  return (
                    <tr key={i} className="table-row">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100" title={tx.txHash}>
                          {tx.txHash?.slice(0, 14)}...{tx.txHash?.slice(-6)}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md">#{tx.blockNumber}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {Object.entries(tx.args || {}).filter(([k]) => k !== "timestamp").map(([k, v]) => (
                            <div key={k}><span className="text-gray-400">{k}:</span> <span className="text-gray-700 font-medium">{String(v).slice(0, 20)}{String(v).length > 20 ? "..." : ""}</span></div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                    No blockchain transactions found. Register donors or recipients to see transactions here.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
