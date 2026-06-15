import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const downloadPDF = async (fileId, fileName) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/organ-listings/report/${fileId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "donor-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  } catch { toast.error("Download failed"); }
};

export default function AvailableOrgans() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchAll();
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000");
    socket.on("new_organ_available", (data) => {
      toast.info(`New ${data.organType} organ available from ${data.hospitalName}!`);
      fetchAll();
    });
    return () => socket.disconnect();
  }, []);

  const fetchAll = () => {
    api.get("/organ-listings").then((r) => setListings(r.data)).catch(() => {});
    if (user?.role === "hospital") {
      api.get("/organ-listings/mine").then((r) => setMyListings(r.data)).catch(() => {});
      api.get("/organ-applications").then((r) => setApplications(r.data)).catch(() => {});
    }
  };

  // Filter out own hospital's listings from the public list
  const otherListings = listings.filter(
    (l) => !myListings.some((m) => m._id === l._id)
  );

  // Find existing application for a listing (this hospital applied their organ to someone)
  // OR another hospital applied this listing to our request
  const getApplicationForListing = (listingId) =>
    applications.find((a) => a.organListingId?._id === listingId || a.organListingId === listingId);

  const isMyListing = (listingId) =>
    myListings.some((l) => l._id === listingId);

  if (selected) {
    const app = getApplicationForListing(selected._id);
    const mine = isMyListing(selected._id);

    return (
      <div className="space-y-6 max-w-3xl">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Available Organs
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-lg border border-emerald-200">
                  {selected.organType}
                </span>
                <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-lg">
                  Blood: {selected.bloodGroup}
                </span>
                {selected.isAvailable
                  ? <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Available</span>
                  : <span className="text-xs text-gray-400 font-medium">Allocated</span>
                }
                {mine && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-medium">Your Listing</span>}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selected.hospitalId?.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{selected.hospitalId?.address}</p>
              <p className="text-xs text-gray-400 mt-0.5">Contact: {selected.hospitalId?.contactNumber}</p>
            </div>
          </div>

          {/* Donor Info */}
          <div className="border-t border-gray-100 pt-5 mb-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Donor Information</div>
            <div className="grid grid-cols-3 gap-4">
              {[["Age", selected.donorAge], ["Gender", selected.donorGender?.charAt(0).toUpperCase() + selected.donorGender?.slice(1)], ["Blood Group", selected.bloodGroup]].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-gray-800">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Condition */}
          <div className="border-t border-gray-100 pt-5 mb-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Medical Condition</div>
            <p className="text-sm text-gray-700 leading-relaxed">{selected.medicalCondition}</p>
            {selected.additionalNotes && <p className="text-xs text-gray-500 mt-2">{selected.additionalNotes}</p>}
          </div>

          {/* Report */}
          {selected.reportFileId && (
            <div className="border-t border-gray-100 pt-5 mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Donor Medical Report</div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <svg className="w-8 h-8 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-emerald-800">Donor Medical Report PDF</div>
                  <div className="text-xs text-emerald-600 mt-0.5">{selected.reportFileName}</div>
                </div>
                <button onClick={() => downloadPDF(selected.reportFileId, selected.reportFileName)} className="btn-primary text-sm px-4 py-2">
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Application status — if this hospital already applied this listing to a patient */}
          {app && (
            <div className="border-t border-gray-100 pt-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Status</div>
              <div className={`rounded-xl border p-4 ${
                app.status === "approved" ? "bg-emerald-50 border-emerald-200" :
                app.status === "rejected" ? "bg-red-50 border-red-200" :
                "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-800">
                    Applied to: {app.organRequestId?.patientName || "—"}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                    app.status === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    app.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
                    app.status === "ai_analyzed" ? "bg-purple-100 text-purple-700 border-purple-200" :
                    "bg-amber-100 text-amber-700 border-amber-200"
                  }`}>
                    {app.status === "ai_analyzed" ? "AI Analyzed" : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Requesting Hospital: <span className="font-medium text-gray-700">{app.requestingHospitalId?.name}</span></div>
                  <div>Organ Status: <span className="font-medium text-gray-700">{app.organStatus}</span></div>
                  {app.aiAnalysis?.matchScore > 0 && (
                    <div>AI Match Score: <span className={`font-bold ${app.aiAnalysis.matchScore >= 75 ? "text-emerald-600" : app.aiAnalysis.matchScore >= 50 ? "text-amber-600" : "text-red-600"}`}>{app.aiAnalysis.matchScore}%</span></div>
                  )}
                  {app.allocationTxHash && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-emerald-100">
                      <div className="text-xs text-emerald-600 font-medium mb-0.5">Blockchain TX</div>
                      <code className="text-xs text-emerald-700 break-all">{app.allocationTxHash}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Posted {new Date(selected.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Available Organs</h1>
        <p className="page-subtitle">All organs posted by hospitals across the network. Click to view full details.</p>
      </div>

      {otherListings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <div className="font-medium text-gray-600 mb-1">No organs available from other hospitals</div>
          <div className="text-sm text-gray-400">You will be notified when an organ becomes available</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {otherListings.map((l) => {
          const app = getApplicationForListing(l._id);
          const mine = isMyListing(l._id);
          return (
            <button key={l._id} onClick={() => setSelected(l)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-lg border border-emerald-200">{l.organType}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md">Blood: {l.bloodGroup}</span>
                    <span className="text-xs text-gray-400">Donor age: {l.donorAge}</span>
                    {l.isAvailable
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Available</span>
                      : <span className="text-xs text-gray-400">Allocated</span>
                    }
                    {mine && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-medium">Your Listing</span>}
                    {app && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                        app.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        app.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {app.status === "ai_analyzed" ? "Applied — AI Analyzed" : `Applied — ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900">{l.hospitalId?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{l.hospitalId?.address}</div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">{l.medicalCondition}</div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {l.reportFileId && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-md font-medium">Report Available</span>}
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
