import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import StatusBadge from "../components/StatusBadge";

export default function ApplicationReview() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = () => {
    api.get("/organ-applications").then((r) => setApplications(r.data)).catch(() => {});
  };

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await api.patch(`/organ-applications/${selected._id}/approve`, { doctorNotes });
      toast.success(data.txHash ? `Approved & recorded on blockchain. TX: ${data.txHash.slice(0, 16)}...` : "Application approved");
      setSelected(null);
      setDoctorNotes("");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.patch(`/organ-applications/${selected._id}/reject`, { doctorNotes });
      toast.success("Application rejected");
      setSelected(null);
      setDoctorNotes("");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally { setLoading(false); }
  };

  const handleReanalyze = async () => {
    if (!selected) return;
    setReanalyzing(true);
    try {
      const { data } = await api.post(`/organ-applications/${selected._id}/reanalyze`);
      setSelected(data.application);
      toast.success("AI re-analysis complete");
      fetchApplications();
    } catch (err) {
      toast.error("Re-analysis failed");
    } finally { setReanalyzing(false); }
  };

  const scoreColor = (score) => {
    if (score >= 75) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const recommendColor = (rec) => {
    if (!rec) return "";
    if (rec.startsWith("RECOMMEND")) return "bg-emerald-50 border-emerald-200 text-emerald-800";
    if (rec.startsWith("CAUTION")) return "bg-amber-50 border-amber-200 text-amber-800";
    return "bg-red-50 border-red-200 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Application Review</h1>
        <p className="page-subtitle">Review AI-analyzed organ applications. Approve or reject based on AI insights and your medical judgment.</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Applications List */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Pending Applications</h3>
            <p className="text-xs text-gray-400 mt-0.5">{applications.length} total</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {applications.length === 0 && (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No applications yet</div>
            )}
            {applications.map((app) => (
              <button key={app._id} onClick={() => { setSelected(app); setDoctorNotes(""); }}
                className={`w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors ${selected?._id === app._id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 text-sm">{app.organRequestId?.patientName || app.recipientId?.name}</div>
                  <StatusBadge status={app.status === "ai_analyzed" ? "pending" : app.status} />
                </div>
                <div className="text-xs text-gray-500">{app.organListingId?.organType} · {app.organRequestId?.bloodGroup || app.recipientId?.bloodGroup}</div>
                <div className="text-xs text-gray-400">{app.providingHospitalId?.name} → {app.requestingHospitalId?.name}</div>
                {app.aiAnalysis?.matchScore > 0 && (
                  <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-md border ${scoreColor(app.aiAnalysis.matchScore)}`}>
                    AI Score: {app.aiAnalysis.matchScore}%
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">{new Date(app.createdAt).toLocaleDateString()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="col-span-3">
          {!selected && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="text-gray-200 text-4xl mb-4">—</div>
              <div className="font-medium text-gray-500">Select an application to review</div>
              <div className="text-sm mt-1">AI analysis and patient details will appear here</div>
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.organRequestId?.patientName || selected.recipientId?.name}</h3>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Age {selected.organRequestId?.patientAge || selected.recipientId?.age} · {selected.organRequestId?.patientGender || selected.recipientId?.gender} · Blood: {selected.organRequestId?.bloodGroup || selected.recipientId?.bloodGroup}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Needs: <span className="font-medium text-gray-700">{selected.organRequestId?.organNeeded || selected.recipientId?.organNeeded}</span> ·
                      Urgency: <span className="font-medium text-gray-700">{selected.organRequestId?.urgencyLevel || selected.recipientId?.urgencyLevel}</span> ·
                      From: {selected.requestingHospitalId?.name}
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Diagnosis</div>
                  <div className="text-sm text-gray-700">{selected.organRequestId?.diagnosis || selected.recipientId?.diagnosis}</div>
                </div>
              </div>

              {/* AI Analysis */}
              {selected.aiAnalysis?.matchScore > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      AI Medical Analysis
                    </h4>
                    <button onClick={handleReanalyze} disabled={reanalyzing}
                      className="btn-secondary text-xs px-3 py-1.5">
                      {reanalyzing ? "Analyzing..." : "Re-analyze"}
                    </button>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`text-3xl font-bold px-4 py-2 rounded-xl border ${scoreColor(selected.aiAnalysis.matchScore)}`}>
                      {selected.aiAnalysis.matchScore}%
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Compatibility Score</div>
                      <div className={`text-xs font-medium mt-1 px-2 py-1 rounded-md border inline-block ${recommendColor(selected.aiAnalysis.recommendation)}`}>
                        {selected.aiAnalysis.recommendation}
                      </div>
                      {selected.aiAnalysis.recommendationReason && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs">{selected.aiAnalysis.recommendationReason}</div>
                      )}
                    </div>
                  </div>

                  {/* Donor & Recipient Profiles */}
                  {(selected.aiAnalysis.donorProfile || selected.aiAnalysis.recipientProfile) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {selected.aiAnalysis.donorProfile && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Donor Profile</div>
                          {Object.entries(selected.aiAnalysis.donorProfile).map(([k, v]) => v && v !== "—" && (
                            <div key={k} className="text-xs mb-1">
                              <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                              <span className="text-gray-800 font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {selected.aiAnalysis.recipientProfile && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Recipient Profile</div>
                          {Object.entries(selected.aiAnalysis.recipientProfile).map(([k, v]) => v && v !== "—" && (
                            <div key={k} className="text-xs mb-1">
                              <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                              <span className="text-gray-800 font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compatibility Factors */}
                  {selected.aiAnalysis.compatibilityFactors && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compatibility Factors</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(selected.aiAnalysis.compatibilityFactors).map(([k, v]) => v && (
                          <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                            <div className="text-xs text-gray-400 capitalize mb-0.5">{k.replace(/([A-Z])/g, ' $1')}</div>
                            <div className="text-xs font-medium text-gray-800">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Insights</div>
                    <div className="space-y-1.5">
                      {selected.aiAnalysis.keyInsights?.map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 flex-shrink-0"></span>
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {selected.aiAnalysis.riskFactors?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk Factors</div>
                      <div className="space-y-1.5">
                        {selected.aiAnalysis.riskFactors.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1 flex-shrink-0"></span>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pre-Transplant Checks */}
                  {selected.aiAnalysis.preTransplantChecks?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pre-Transplant Checks Required</div>
                      <div className="space-y-1.5">
                        {selected.aiAnalysis.preTransplantChecks.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-blue-700">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical Summary */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Medical Summary</div>
                    <div className="text-sm text-blue-800">{selected.aiAnalysis.medicalSummary}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                  <svg className="animate-spin w-6 h-6 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <div className="text-sm font-medium text-gray-600">AI Analysis in Progress...</div>
                  <div className="text-xs text-gray-400 mt-1">Gemini is analyzing both medical reports</div>
                </div>
              )}

              {/* Doctor Decision */}
              {selected.status !== "approved" && selected.status !== "rejected" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Doctor Decision</h4>
                  <div className="mb-4">
                    <label className="form-label">Doctor Notes <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} rows={3}
                      placeholder="Add your medical notes or reason for decision..." className="form-input resize-none" />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-700 font-medium">Once approved, this allocation will be permanently recorded on the Ethereum blockchain and cannot be changed.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleApprove} disabled={loading}
                      className="btn-primary flex-1 justify-center">
                      {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Recording on Blockchain...</> : "Approve & Record on Blockchain"}
                    </button>
                    <button onClick={handleReject} disabled={loading} className="btn-danger flex-1 justify-center">
                      Reject Application
                    </button>
                  </div>
                </div>
              )}

              {/* Already decided */}
              {(selected.status === "approved" || selected.status === "rejected") && (
                <div className={`rounded-xl border p-5 ${selected.status === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <div className={`font-semibold text-sm mb-2 ${selected.status === "approved" ? "text-emerald-800" : "text-red-800"}`}>
                    {selected.status === "approved" ? "Approved — Recorded on Blockchain" : "Rejected"}
                  </div>
                  {selected.allocationTxHash && (
                    <div>
                      <div className="text-xs text-emerald-600 font-medium mb-1">Transaction Hash (Immutable)</div>
                      <code className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md break-all">{selected.allocationTxHash}</code>
                    </div>
                  )}
                  {selected.doctorNotes && (
                    <div className="mt-2 text-xs text-gray-600">Notes: {selected.doctorNotes}</div>
                  )}

                  {/* Organ Status Update — only for approved */}
                  {selected.status === "approved" && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">Update Organ Transport Status</div>
                      <div className="grid grid-cols-2 gap-2">
                        {["InTransit", "Delivered", "Completed"].map((s) => (
                          <button key={s} onClick={async () => {
                            try {
                              await api.patch(`/organ-applications/${selected._id}/organ-status`, { organStatus: s });
                              toast.success(`Status updated to ${s}`);
                              fetchApplications();
                              setSelected(prev => ({ ...prev, organStatus: s }));
                            } catch (err) {
                              toast.error(err.response?.data?.message || "Update failed");
                            }
                          }}
                            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                              selected.organStatus === s
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
                            }`}>
                            {s === "InTransit" ? "In Transit" : s}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status History</div>
                        <div className="space-y-1.5">
                          {selected.organStatusHistory?.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                              <span className="font-medium">{h.status}</span>
                              <span className="text-gray-400">{new Date(h.updatedAt).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
