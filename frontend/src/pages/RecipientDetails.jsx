import { useState, useEffect } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { toast } from "react-toastify";

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

const downloadPDF = async (fileId, fileName, endpoint) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/${endpoint}/${fileId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  } catch { toast.error("Could not download report"); }
};

export default function RecipientDetails() {
  const [allRequests, setAllRequests] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [selected, setSelected] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiListingId, setAiListingId] = useState(null);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = () => {
    api.get("/organ-requests").then((r) => setAllRequests(r.data)).catch(() => {});
    api.get("/organ-listings/mine").then((r) => setMyListings(r.data)).catch(() => {});
    api.get("/organ-applications").then((r) => setApplications(r.data)).catch(() => {});
    api.get("/hospitals/me").then((r) => setHospital(r.data)).catch(() => {});
  };

  const availableMyListings = myListings.filter((l) => l.isAvailable);

  // Only show requests from OTHER hospitals, not this hospital's own requests
  const otherRequests = allRequests.filter(
    (r) => hospital && r.hospitalId?._id !== hospital._id
  );

  const getAiInsights = async (listingId, requestId) => {
    setAiLoading(true);
    setAiListingId(listingId);
    setAiInsights(null);
    try {
      const { data } = await api.post("/organ-applications/ai-insights", {
        organListingId: listingId,
        organRequestId: requestId,
      });
      setAiInsights(data.analysis);
    } catch (err) {
      toast.error(err.response?.data?.message || "AI analysis failed");
    } finally { setAiLoading(false); }
  };

  const handleAllocate = async (listingId, requestId) => {
    setAllocating(true);
    try {
      await api.post("/organ-applications", { organListingId: listingId, organRequestId: requestId });
      toast.success("Organ allocated successfully! AI analysis running in background.");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Allocation failed");
    } finally { setAllocating(false); }
  };

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected) {
    const req = selected;
    const compatibleListings = availableMyListings.filter((l) => l.organType === req.organNeeded);
    const existingApp = applications.find(
      (a) => a.organRequestId?._id === req._id || a.organRequestId === req._id
    );

    return (
      <div className="space-y-6 max-w-full">
        <button onClick={() => { setSelected(null); setAiInsights(null); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Recipient Details
        </button>

        {/* Patient Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{req.patientName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusBadge status={req.urgencyLevel} />
                <span className="text-xs text-gray-400">Posted {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold px-3 py-1 rounded-lg self-start">
              Needs: {req.organNeeded}
            </span>
          </div>

          {/* Patient details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
            {[
              ["Age", req.patientAge],
              ["Gender", req.patientGender],
              ["Blood Group", req.bloodGroup],
              ["Organ Needed", req.organNeeded],
              ["Urgency", req.urgencyLevel],
              ["Treating Doctor", req.treatingDoctorName || "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="text-sm font-medium text-gray-800 capitalize">{value || "—"}</div>
              </div>
            ))}
          </div>

          {/* Diagnosis */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Diagnosis</div>
            <p className="text-sm text-gray-700">{req.diagnosis}</p>
          </div>

          {/* Requesting Hospital full details */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requesting Hospital</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ["Hospital Name", req.hospitalId?.name],
                ["Address", req.hospitalId?.address],
                ["Contact Number", req.hospitalId?.contactNumber],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="text-sm font-medium text-gray-800">{value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Medical Report */}
          {req.reportFileId && (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Patient Medical Report</div>
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-800">Patient Medical Report PDF</div>
                  <div className="text-xs text-blue-600 mt-0.5">{req.reportFileName}</div>
                </div>
                <button
                  onClick={() => downloadPDF(req.reportFileId, req.reportFileName, "organ-requests/report")}
                  className="btn-primary text-sm px-4 py-2">
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compatible Organs + Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-1">Your Compatible Organs</h3>
          <p className="text-xs text-gray-400 mb-4">
            Available organs from your hospital matching this patient's need ({req.organNeeded})
          </p>

          {existingApp ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 font-medium">
              You have already allocated an organ to this patient. Current status: <span className="capitalize font-bold">{existingApp.status}</span>
            </div>
          ) : compatibleListings.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">No compatible organs available from your hospital</div>
              <div className="text-xs text-gray-400">
                {availableMyListings.length === 0
                  ? "You have no available organ listings. Use 'Post Available Organ' to add one."
                  : `You have ${availableMyListings.length} organ(s) available but none match ${req.organNeeded}.`}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {compatibleListings.map((listing) => (
                <div key={listing._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-lg border border-emerald-200">
                          {listing.organType}
                        </span>
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md">
                          Blood: {listing.bloodGroup}
                        </span>
                        <span className="text-xs text-gray-400">Donor age: {listing.donorAge} · {listing.donorGender}</span>
                      </div>
                      <div className="text-xs text-gray-500">{listing.medicalCondition}</div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 flex-shrink-0">
                      {listing.reportFileId && (
                        <button
                          onClick={() => downloadPDF(listing.reportFileId, listing.reportFileName, "organ-listings/report")}
                          className="btn-secondary text-xs px-3 py-1.5">
                          Download Donor Report
                        </button>
                      )}
                      <button
                        onClick={() => getAiInsights(listing._id, req._id)}
                        disabled={aiLoading && aiListingId === listing._id}
                        className="btn-secondary text-xs px-3 py-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                        {aiLoading && aiListingId === listing._id ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Analyzing...
                          </span>
                        ) : "Get AI Insights"}
                      </button>
                      <button
                        onClick={() => handleAllocate(listing._id, req._id)}
                        disabled={allocating}
                        className="btn-primary text-xs px-3 py-1.5 justify-center">
                        {allocating ? "Allocating..." : "Allocate Organ"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights Panel */}
        {aiInsights && (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                AI Medical Analysis
              </h3>
              <button onClick={() => setAiInsights(null)} className="text-gray-400 hover:text-gray-600 text-xs">Close</button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className={`text-3xl font-bold px-4 py-2 rounded-xl border ${scoreColor(aiInsights.matchScore)}`}>
                {aiInsights.matchScore}%
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700">Compatibility Score</div>
                <div className={`text-xs font-medium mt-1 px-2 py-1 rounded-md border inline-block ${recommendColor(aiInsights.recommendation)}`}>
                  {aiInsights.recommendation}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Blood Compatibility</div>
                <div className="text-sm text-gray-700">{aiInsights.bloodCompatibility}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Organ Compatibility</div>
                <div className="text-sm text-gray-700">{aiInsights.organCompatibility}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Insights</div>
              <div className="space-y-2">
                {aiInsights.keyInsights?.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Medical Summary</div>
              <div className="text-sm text-blue-800">{aiInsights.medicalSummary}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Recipient Details</h1>
        <p className="page-subtitle">All patients waiting for organs across the network. Click a recipient to view full details, get AI insights, and allocate an organ.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">All Waiting Recipients</h3>
          <p className="text-xs text-gray-400 mt-0.5">{otherRequests.length} total · from other hospitals</p>
        </div>

        <div className="divide-y divide-gray-100">
          {otherRequests.length === 0 && (
            <div className="px-5 py-16 text-center text-gray-400 text-sm">
              No organ requests from other hospitals yet
            </div>
          )}
          {otherRequests.map((req) => {
            const hasCompatible = availableMyListings.some((l) => l.organType === req.organNeeded);
            const alreadyAllocated = applications.some(
              (a) => a.organRequestId?._id === req._id || a.organRequestId === req._id
            );
            return (
              <button key={req._id} onClick={() => { setSelected(req); setAiInsights(null); }}
                className="w-full px-4 sm:px-6 py-4 text-left hover:bg-gray-50 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{req.patientName}</span>
                      <StatusBadge status={req.urgencyLevel} />
                      {hasCompatible && !alreadyAllocated && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                          Compatible organ available
                        </span>
                      )}
                      {alreadyAllocated && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                          Allocated
                        </span>
                      )}
                      {req.isFulfilled && (
                        <span className="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-md font-medium">
                          Fulfilled
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      <span>Needs: <span className="font-medium text-gray-700">{req.organNeeded}</span></span>
                      <span>Blood: <span className="font-medium text-gray-700">{req.bloodGroup}</span></span>
                      <span>Age: {req.patientAge}</span>
                      <span>From: <span className="font-medium text-gray-700">{req.hospitalId?.name}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.reportFileId && (
                      <span className="hidden sm:inline text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-md">Report</span>
                    )}
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
