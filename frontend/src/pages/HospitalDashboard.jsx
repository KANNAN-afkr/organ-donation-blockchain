import { useState, useEffect } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { toast } from "react-toastify";

export default function HospitalDashboard() {
  const [myListings, setMyListings] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [tab, setTab] = useState("listings");
  const [hForm, setHForm] = useState({ name: "", licenseNumber: "", address: "", contactNumber: "", specializations: "" });
  const [hLoading, setHLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
    api.get("/hospitals/me").then((r) => setHospital(r.data)).catch(() => {});
    api.get("/organ-listings/mine").then((r) => setMyListings(r.data)).catch(() => {});
    api.get("/organ-requests/mine").then((r) => setMyRequests(r.data)).catch(() => {});
    api.get("/organ-applications").then((r) => setApplications(r.data)).catch(() => {});
  };

  const registerHospital = async (e) => {
    e.preventDefault();
    setHLoading(true);
    try {
      const { data } = await api.post("/hospitals", {
        ...hForm,
        specializations: hForm.specializations.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setHospital(data);
      setShowRegister(false);
      toast.success("Hospital registered successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setHLoading(false); }
  };

  const availableListings = myListings.filter((l) => l.isAvailable);
  const approvedApps = applications.filter((a) => a.status === "approved");
  const pendingApps = applications.filter((a) => a.status === "pending" || a.status === "ai_analyzed");

  const stats = [
    { label: "My Organ Listings",    value: myListings.length,      color: "border-l-emerald-500" },
    { label: "Available Now",        value: availableListings.length, color: "border-l-blue-500" },
    { label: "My Patient Requests",  value: myRequests.length,      color: "border-l-amber-500" },
    { label: "Approved Allocations", value: approvedApps.length,    color: "border-l-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Hospital Dashboard</h1>
        <p className="page-subtitle">Overview of your hospital's organ listings, patient requests, and allocations</p>
      </div>

      {/* Hospital Profile */}
      {!hospital ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="font-medium text-amber-800 text-sm mb-2">Complete Your Hospital Profile</div>
          <p className="text-xs text-amber-700 mb-3">Register your hospital details to start posting available organs.</p>
          {!showRegister ? (
            <button onClick={() => setShowRegister(true)} className="btn-primary text-sm">Register Hospital Profile</button>
          ) : (
            <form onSubmit={registerHospital} className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="form-label">Hospital Name</label>
                <input value={hForm.name} onChange={(e) => setHForm({ ...hForm, name: e.target.value })}
                  required placeholder="City General Hospital" className="form-input" />
              </div>
              <div>
                <label className="form-label">License Number</label>
                <input value={hForm.licenseNumber} onChange={(e) => setHForm({ ...hForm, licenseNumber: e.target.value })}
                  required placeholder="LIC-12345" className="form-input" />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input value={hForm.address} onChange={(e) => setHForm({ ...hForm, address: e.target.value })}
                  required placeholder="123 Medical St, City" className="form-input" />
              </div>
              <div>
                <label className="form-label">Contact Number</label>
                <input value={hForm.contactNumber} onChange={(e) => setHForm({ ...hForm, contactNumber: e.target.value })}
                  required placeholder="+91 44 2345 6789" className="form-input" />
              </div>
              <div className="col-span-2">
                <label className="form-label">Specializations <span className="text-gray-400 normal-case font-normal">(comma separated)</span></label>
                <input value={hForm.specializations} onChange={(e) => setHForm({ ...hForm, specializations: e.target.value })}
                  placeholder="Cardiology, Nephrology, Hepatology" className="form-input" />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={hLoading} className="btn-primary">{hLoading ? "Registering..." : "Register"}</button>
                <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{hospital.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{hospital.address} · License: {hospital.licenseNumber} · {hospital.contactNumber}</div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">Verified Hospital</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.color} p-5 shadow-sm`}>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "listings",     label: `My Organ Listings (${myListings.length})` },
          { key: "requests",     label: `My Patient Requests (${myRequests.length})` },
          { key: "applications", label: `Applications (${applications.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* MY ORGAN LISTINGS */}
      {tab === "listings" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">My Organ Listings</h3>
            <p className="text-xs text-gray-400 mt-0.5">Organs your hospital has posted — visible to all hospitals in the network</p>
          </div>
          <div className="divide-y divide-gray-100">
            {myListings.length === 0 && (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                No organ listings yet. Use "Post Available Organ" from the sidebar.
              </div>
            )}
            {myListings.map((l) => {
              const app = applications.find((a) => a.organListingId?._id === l._id || a.organListingId === l._id);
              const isCompleted = app?.organStatus === "Completed" || !l.isAvailable;
              return (
                <div key={l._id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-lg border border-emerald-200">{l.organType}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md">Blood: {l.bloodGroup}</span>
                      <span className="text-xs text-gray-400">{l.donorAge} · {l.donorGender}</span>
                      {l.isAvailable
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Available</span>
                        : <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-medium">Allocated</span>
                      }
                    </div>
                    <span className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Allocated details — shown when organ is allocated */}
                  {app && (
                    <div className={`rounded-xl border p-4 mt-2 ${
                      app.organStatus === "Completed" ? "bg-teal-50 border-teal-200" : "bg-emerald-50 border-emerald-200"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-sm text-gray-800">Allocated to Patient</div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                          app.organStatus === "Completed" ? "bg-teal-100 text-teal-700 border-teal-200" :
                          app.organStatus === "Delivered" ? "bg-orange-100 text-orange-700 border-orange-200" :
                          app.organStatus === "InTransit" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}>{app.organStatus}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {[
                          ["Patient Name",        app.organRequestId?.patientName],
                          ["Blood Group",         app.organRequestId?.bloodGroup],
                          ["Organ Needed",        app.organRequestId?.organNeeded],
                          ["Urgency",             app.organRequestId?.urgencyLevel],
                          ["Requesting Hospital", app.requestingHospitalId?.name],
                          ["Hospital Contact",    app.requestingHospitalId?.contactNumber],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-white rounded-lg p-2.5">
                            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                            <div className="text-xs font-semibold text-gray-800 capitalize">{value || "—"}</div>
                          </div>
                        ))}
                      </div>

                      {/* Diagnosis */}
                      {app.organRequestId?.diagnosis && (
                        <div className="bg-white rounded-lg p-2.5 mb-3">
                          <div className="text-xs text-gray-400 mb-0.5">Diagnosis</div>
                          <div className="text-xs text-gray-700">{app.organRequestId.diagnosis}</div>
                        </div>
                      )}

                      {/* Patient report download */}
                      {app.organRequestId?.reportFileId && (
                        <div className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-lg mb-3">
                          <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                          </svg>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-blue-800">Patient Medical Report</div>
                            <div className="text-xs text-blue-500">{app.organRequestId.reportFileName}</div>
                          </div>
                          <button onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(`${import.meta.env.VITE_API_URL}/organ-requests/report/${app.organRequestId.reportFileId}`, { headers: { Authorization: `Bearer ${token}` } });
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a"); a.href = url; a.download = app.organRequestId.reportFileName || "report.pdf"; a.click(); URL.revokeObjectURL(url);
                            } catch { toast.error("Download failed"); }
                          }} className="btn-secondary text-xs px-3 py-1.5">Download</button>
                        </div>
                      )}

                      {/* Status history */}
                      {app.organStatusHistory?.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status History</div>
                          <div className="space-y-1.5">
                            {app.organStatusHistory.map((h, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                                <span className="font-medium text-gray-700">{h.status}</span>
                                {h.note && <span className="text-gray-500">— {h.note}</span>}
                                <span className="text-gray-400 ml-auto">{new Date(h.updatedAt).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blockchain TX */}
                      {app.allocationTxHash && (
                        <div className="mt-3 p-2 bg-white rounded-lg border border-emerald-100">
                          <div className="text-xs text-emerald-600 font-medium mb-0.5">Blockchain TX (Immutable)</div>
                          <code className="text-xs text-emerald-700 break-all">{app.allocationTxHash}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MY PATIENT REQUESTS */}
      {tab === "requests" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">My Patient Requests</h3>
            <p className="text-xs text-gray-400 mt-0.5">Organ requests your hospital has posted — visible to all hospitals in the network</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{["Patient", "Organ Needed", "Blood Group", "Urgency", "Status", "Posted"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {myRequests.map((r) => (
                  <tr key={r._id} className="table-row">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{r.patientName}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.organNeeded}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs font-medium">{r.bloodGroup}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.urgencyLevel} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.isFulfilled ? "completed" : "active"} /></td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {myRequests.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No patient requests yet. Use "Request Organ for Patient" from the sidebar.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLICATIONS */}
      {tab === "applications" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Organ Applications</h3>
            <p className="text-xs text-gray-400 mt-0.5">All applications where your hospital is providing or receiving an organ</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>{["Organ", "Patient", "Providing Hospital", "Requesting Hospital", "AI Score", "Status", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a._id} className="table-row">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{a.organListingId?.organType || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.organRequestId?.patientName || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.providingHospitalId?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.requestingHospitalId?.name || "—"}</td>
                    <td className="px-5 py-3.5">
                      {a.aiAnalysis?.matchScore > 0 ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                          a.aiAnalysis.matchScore >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          a.aiAnalysis.matchScore >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>{a.aiAnalysis.matchScore}%</span>
                      ) : <span className="text-gray-300 text-xs">Analyzing...</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No applications yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
