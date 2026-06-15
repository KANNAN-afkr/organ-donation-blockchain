import { useState, useEffect } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { toast } from "react-toastify";

export default function TransplantHistory() {
  const [allocations, setAllocations] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => { api.get("/allocations").then((r) => setAllocations(r.data)).catch(() => {}); }, []);

  const confirmTransplant = async (id) => {
    setConfirmingId(id);
    try {
      const { data } = await api.patch(`/allocations/${id}/confirm-transplant`);
      setAllocations((prev) => prev.map((a) => (a._id === id ? data.allocation : a)));
      toast.success(data.txHash ? `Transplant confirmed on blockchain. TX: ${data.txHash.slice(0, 16)}...` : "Transplant confirmed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Confirmation failed");
    } finally { setConfirmingId(null); }
  };

  const completed = allocations.filter((a) => a.status === "completed");
  const pending   = allocations.filter((a) => a.status !== "completed");

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Transplant History</h1>
        <p className="page-subtitle">Blockchain-verified immutable transplant records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Allocations",    value: allocations.length, color: "border-l-emerald-500" },
          { label: "Pending Transplants",  value: pending.length,     color: "border-l-amber-500" },
          { label: "Completed Transplants",value: completed.length,   color: "border-l-blue-500" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.color} p-5 shadow-sm`}>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
            <h3 className="font-semibold text-amber-800 text-sm">Pending Transplants</h3>
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-md">{pending.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{["Donor", "Recipient", "Hospital", "Organ", "Status", "Allocated On", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a._id} className="table-row">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{a.donorId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.recipientId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.hospitalId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.organType}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      {a.status === "confirmed" && (
                        <button onClick={() => confirmTransplant(a._id)} disabled={confirmingId === a._id} className="btn-success text-xs px-3 py-1.5">
                          {confirmingId === a._id ? (
                            <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Confirming...</>
                          ) : "Confirm Transplant"}
                        </button>
                      )}
                      {a.status === "pending" && <span className="text-xs text-gray-400">Awaiting confirmation</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center justify-between">
          <h3 className="font-semibold text-emerald-800 text-sm">Completed Transplants — Blockchain Records</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md">{completed.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>{["Donor", "Recipient", "Hospital", "Organ", "Transplant Date", "Allocation TX", "Transplant TX"].map((h) => (
                <th key={h} className="px-5 py-3 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {completed.map((a) => (
                <tr key={a._id} className="table-row">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{a.donorId?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{a.recipientId?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{a.hospitalId?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{a.organType}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{a.transplantDate ? new Date(a.transplantDate).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3.5">
                    {a.allocationTxHash
                      ? <code className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100" title={a.allocationTxHash}>{a.allocationTxHash.slice(0, 10)}...</code>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.transplantTxHash
                      ? <code className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100" title={a.transplantTxHash}>{a.transplantTxHash.slice(0, 10)}...</code>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
              {completed.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-gray-400 text-sm">No completed transplants yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
