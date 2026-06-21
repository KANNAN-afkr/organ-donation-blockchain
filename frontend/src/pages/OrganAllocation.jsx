import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { toast } from "react-toastify";

export default function OrganAllocation() {
  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({ donorId: "", recipientId: "", hospitalId: "", organType: "" });
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [smartAllocating, setSmartAllocating] = useState(false);
  const [tab, setTab] = useState("suggestions");

  const fetchAll = useCallback(() => {
    api.get("/donors").then((r) => setDonors(r.data.filter((d) => d.isApproved && !d.isAllocated))).catch(() => {});
    api.get("/recipients").then((r) => setRecipients(r.data.filter((r) => !r.isMatched))).catch(() => {});
    api.get("/hospitals").then((r) => setHospitals(r.data)).catch(() => {});
    api.get("/allocations").then((r) => setAllocations(r.data)).catch(() => {});
    api.get("/match").then((r) => setMatches(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getHospitalId = async () => {
    if (hospitals.length > 0) return hospitals[0]._id;
    try { const { data } = await api.get("/hospitals/me"); return data._id; } catch {}
    try { const { data } = await api.get("/hospitals"); if (data.length > 0) return data[0]._id; } catch {}
    return null;
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === "donorId") {
      const donor = donors.find((d) => d._id === e.target.value);
      if (donor) updated.organType = donor.organType;
    }
    setForm(updated);
  };

  const handleSmartAutoAllocate = async () => {
    setSmartAllocating(true);
    try {
      const { data } = await api.post("/allocations/smart-auto-allocate");
      toast.success(data.txHash ? `Smart allocation recorded. TX: ${data.txHash.slice(0, 16)}...` : "Smart allocation completed");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Smart allocation failed");
    } finally { setSmartAllocating(false); }
  };

  const handleApproveMatch = async (match) => {
    setApprovingId(match.donor._id);
    try {
      const hospitalId = await getHospitalId();
      if (!hospitalId) { toast.error("No hospital profile found. Register a hospital first."); setApprovingId(null); return; }
      const { data } = await api.post("/allocations", {
        donorId: match.donor._id, recipientId: match.bestMatch._id, hospitalId, organType: match.donor.organType,
      });
      toast.success(data.txHash ? `Allocation recorded on blockchain. TX: ${data.txHash.slice(0, 16)}...` : "Allocation approved");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    } finally { setApprovingId(null); }
  };

  const handleManualAllocate = async (e) => {
    e.preventDefault();
    if (!form.donorId || !form.recipientId || !form.hospitalId) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/allocations", { ...form });
      toast.success(data.txHash ? `Allocation recorded on blockchain. TX: ${data.txHash.slice(0, 16)}...` : "Organ allocated");
      setForm({ donorId: "", recipientId: "", hospitalId: "", organType: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Allocation failed");
    } finally { setLoading(false); }
  };

  const urgencyColor = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high:     "bg-orange-50 text-orange-700 border-orange-200",
    medium:   "bg-amber-50 text-amber-700 border-amber-200",
    low:      "bg-blue-50 text-blue-700 border-blue-200",
  };

  const stats = [
    { label: "Available Donors",   value: donors.length,      color: "border-l-emerald-500" },
    { label: "Waiting Recipients", value: recipients.length,  color: "border-l-blue-500" },
    { label: "Suggested Matches",  value: matches.length,     color: "border-l-purple-500" },
    { label: "Total Allocations",  value: allocations.length, color: "border-l-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Organ Allocation</h1>
        <p className="page-subtitle">System suggests compatible matches — doctor reviews and approves each allocation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div key={s.label} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.color} p-5 shadow-sm`}>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Smart Auto-Allocation */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-base mb-1">Smart Contract Auto-Allocation</h2>
            <p className="text-gray-400 text-sm max-w-2xl">
              Automatically find the best donor-recipient match based on organ type, blood compatibility, and priority level using on-chain smart contract logic.
            </p>
          </div>
          <button onClick={handleSmartAutoAllocate}
            disabled={smartAllocating || donors.length === 0 || recipients.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 ml-6">
            {smartAllocating ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</>
            ) : "Run Smart Allocation"}
          </button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Allocation Workflow</div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { step: 1, label: "Donor Registered",           done: true },
            { step: 2, label: "Hospital Approves Donor",    done: true },
            { step: 3, label: "System Suggests Match",      done: matches.length > 0 },
            { step: 4, label: "Doctor Reviews & Approves",  done: false, active: true },
            { step: 5, label: "Blockchain Records",         done: false },
            { step: 6, label: "Transplant Confirmed",       done: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                s.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                s.done   ? "bg-gray-50 text-gray-600 border-gray-200" :
                           "bg-gray-50 text-gray-400 border-gray-100"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                  s.active ? "bg-emerald-600 text-white" :
                  s.done   ? "bg-gray-400 text-white" :
                             "bg-gray-200 text-gray-400"}`}>{s.step}</span>
                {s.label}
              </div>
              {i < 5 && <span className="text-gray-300 text-xs">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg"> label: `Suggestions (${matches.length})` },
          { key: "manual",      label: "Manual Allocation" },
          { key: "records",     label: `Records (${allocations.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* SUGGESTIONS TAB */}
      {tab === "suggestions" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="font-medium text-amber-800 text-sm mb-1">Doctor Review Required</div>
            <p className="text-xs text-amber-700">
              The system has identified compatible donor-recipient pairs based on organ type, blood group, and urgency.
              Each match must be reviewed and approved by a doctor before being recorded on the blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">       desc: "Donor organ must exactly match recipient's required organ" },
              { title: "Blood Group Compatible", desc: "Based on universal donor-recipient blood compatibility rules" },
              { title: "Urgency Priority",       desc: "Critical > High > Medium > Low — most urgent recipient first" },
            ].map((c) => (
              <div key={c.title} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mb-3"></div>
                <div className="font-medium text-gray-800 text-sm">{c.title}</div>
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>

          {matches.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
              <div className="text-gray-300 text-4xl mb-3">—</div>
              <div className="font-medium text-gray-600">No Compatible Matches Found</div>
              <div className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Ensure donors are approved in Hospital Dashboard and recipients have a matching organ type with compatible blood group.
              </div>
            </div>
          )}

          {matches.map((match, i) => (
            <div key={match.donor._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-semibold text-gray-800 text-sm">Suggested Match</span>
                  <span className="text-xs text-gray-400">— awaiting doctor approval</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${urgencyColor[match.bestMatch.urgencyLevel]}`}>
                  {match.bestMatch.urgencyLevel?.toUpperCase()} URGENCY
                </span>
              </div>

              <div className="flex items-stretch gap-4 mb-5">
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Donor</div>
                  <div className="font-semibold text-gray-900">{match.donor.name}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-medium">{match.donor.organType}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{match.donor.bloodType}</span>
                    <span className="text-xs text-gray-400">Age {match.donor.age}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 px-4">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">Compatible</span>
                  <span className="text-gray-300 text-lg">→</span>
                </div>

                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Recipient</div>
                  <div className="font-semibold text-gray-900">{match.bestMatch.name}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">Needs {match.bestMatch.organNeeded}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{match.bestMatch.bloodType}</span>
                    <StatusBadge status={match.bestMatch.urgencyLevel} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Doctor must review compatibility before approving. This action will be permanently recorded on the Ethereum blockchain.</p>
                <button onClick={() => handleApproveMatch(match)} disabled={approvingId === match.donor._id}
                  className="btn-primary ml-4 flex-shrink-0">
                  {approvingId === match.donor._id ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Recording...</>
                  ) : "Approve & Allocate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MANUAL TAB */}
      {tab === "manual" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
          <h3 className="font-semibold text-gray-800 mb-1">Manual Organ Allocation</h3>
          <p className="text-xs text-gray-400 mb-5">For cases where the doctor selects a specific donor-recipient pair outside of system suggestions.</p>
          <form onSubmit={handleManualAllocate} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Select Donor</label>
              <select name="donorId" value={form.donorId} onChange={handleChange} className="form-input">
                <option value="">— Select Approved Donor —</option>
                {donors.map((d) => <option key={d._id} value={d._id}>{d.name} · {d.organType} · {d.bloodType}</option>)}
              </select>
              {donors.length === 0 && <p className="text-xs text-amber-600 mt-1">No approved donors. Approve from Hospital Dashboard first.</p>}
            </div>
            <div>
              <label className="form-label">Select Recipient</label>
              <select name="recipientId" value={form.recipientId} onChange={handleChange} className="form-input">
                <option value="">— Select Recipient —</option>
                {recipients.map((r) => <option key={r._id} value={r._id}>{r.name} · needs {r.organNeeded} · {r.bloodType}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Select Hospital</label>
              <select name="hospitalId" value={form.hospitalId} onChange={handleChange} className="form-input">
                <option value="">— Select Hospital —</option>
                {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Organ Type</label>
              <input type="text" value={form.organType || "Select a donor first"} readOnly className="form-input bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Recording on Blockchain...</> : "Approve & Record on Blockchain"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECORDS TAB */}
      {tab === "records" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Allocation Records</h3>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">{allocations.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{["Donor", "Recipient", "Hospital", "Organ", "Status", "Date", "Blockchain TX"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a._id} className="table-row">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{a.donorId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.recipientId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.hospitalId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.organType}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      {a.allocationTxHash
                        ? <code className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100" title={a.allocationTxHash}>{a.allocationTxHash.slice(0, 10)}...</code>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-gray-400 text-sm">No allocations yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
