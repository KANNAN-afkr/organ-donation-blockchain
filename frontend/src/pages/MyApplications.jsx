import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

const ORGANS = ["Heart", "Kidney", "Liver", "Lung", "Pancreas", "Cornea", "Bone Marrow"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ORGAN_STAGES = [
  { key: "Waiting",        label: "Waiting for Organ",            desc: "Your application is registered. Waiting for a matching organ." },
  { key: "Pending",        label: "Match Found — Under Review",    desc: "A matching organ has been found. Doctor is reviewing." },
  { key: "Approved",       label: "Organ Matched & Allocated",     desc: "Doctor approved — permanently recorded on blockchain." },
  { key: "InTransit",      label: "Organ In Transit",              desc: "Organ is on the way to your hospital." },
  { key: "NearbyHospital", label: "Organ Nearby Your Hospital",    desc: "Organ is nearby your hospital. Prepare for arrival." },
  { key: "Delivered",      label: "Organ Delivered",               desc: "Organ has arrived at your hospital." },
  { key: "Completed",      label: "Transplant Completed",          desc: "Transplant successfully completed." },
];

const downloadPDF = async (fileId, fileName, endpoint) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/${endpoint}/${fileId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Could not download report");
  }
};

export default function MyApplications() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    name: "", age: "", gender: "male", bloodGroup: "A+",
    organNeeded: "Kidney", urgencyLevel: "medium", diagnosis: "",
    hospitalName: "", hospitalAddress: "",
    hospitalContactNumber: "", hospitalEmergencyContact: "",
    treatingDoctorName: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setPageLoading(true);
    try {
      const [profileRes, appsRes] = await Promise.all([
        api.get("/recipients/me").catch(() => null),
        api.get("/organ-applications/mine").catch(() => ({ data: [] })),
      ]);
      if (profileRes?.data) {
        const p = profileRes.data;
        setProfile(p);
        setForm(f => ({
          ...f,
          name: p.name || "", age: p.age || "", gender: p.gender || "male",
          bloodGroup: p.bloodGroup || "A+", organNeeded: p.organNeeded || "Kidney",
          urgencyLevel: p.urgencyLevel || "medium", diagnosis: p.diagnosis || "",
          hospitalName: p.hospitalName || "", hospitalAddress: p.hospitalAddress || "",
          hospitalContactNumber: p.hospitalContactNumber || "",
          hospitalEmergencyContact: p.hospitalEmergencyContact || "",
          treatingDoctorName: p.treatingDoctorName || "",
        }));
      }
      setApplications(appsRes.data);
    } finally { setPageLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please upload your medical report PDF"); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, String(v)); });
      formData.append("report", file);
      await api.post("/recipients/application-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Application registered! You will be notified when a matching organ is available.");
      setShowForm(false);
      setFile(null);
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Submission failed";
      toast.error(msg);
      console.error("[Submit]", err.response?.status, msg);
    } finally { setLoading(false); }
  };

  const getStageIndex = (organStatus) => {
    const idx = ORGAN_STAGES.findIndex((s) => s.key === organStatus);
    return idx === -1 ? 0 : idx;
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">Register your organ need. You will be matched when a compatible organ becomes available.</p>
        </div>
        {/* Always show Apply button when not in form */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
            {applications.length > 0 ? "+ Apply for Another Organ" : "Apply Now"}
          </button>
        )}
      </div>

      {/* APPLICATION FORM */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Organ Transplant Application</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill all sections. You will be matched when a compatible organ is available.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm font-semibold text-gray-700">Personal & Medical Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    required placeholder="Jane Doe" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Age</label>
                  <input type="number" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})}
                    required placeholder="30" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="form-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Blood Group</label>
                  <select value={form.bloodGroup} onChange={(e) => setForm({...form, bloodGroup: e.target.value})} className="form-input">
                    {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Organ Needed</label>
                  <select value={form.organNeeded} onChange={(e) => setForm({...form, organNeeded: e.target.value})} className="form-input">
                    {ORGANS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Urgency Level</label>
                  <select value={form.urgencyLevel} onChange={(e) => setForm({...form, urgencyLevel: e.target.value})} className="form-input">
                    {["low","medium","high","critical"].map((u) => (
                      <option key={u} value={u}>{u.charAt(0).toUpperCase()+u.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Medical Diagnosis</label>
                  <textarea value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})}
                    required rows={3} placeholder="Describe your condition and why you need this organ..."
                    className="form-input resize-none" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Section 2 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm font-semibold text-gray-700">Admitted Hospital Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Hospital Name</label>
                  <input value={form.hospitalName} onChange={(e) => setForm({...form, hospitalName: e.target.value})}
                    required placeholder="City General Hospital" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Hospital Address</label>
                  <input value={form.hospitalAddress} onChange={(e) => setForm({...form, hospitalAddress: e.target.value})}
                    placeholder="123 Medical Street, City" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Hospital Contact Number</label>
                  <input value={form.hospitalContactNumber} onChange={(e) => setForm({...form, hospitalContactNumber: e.target.value})}
                    placeholder="+91 44 2345 6789" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Hospital Emergency Contact</label>
                  <input value={form.hospitalEmergencyContact} onChange={(e) => setForm({...form, hospitalEmergencyContact: e.target.value})}
                    placeholder="+91 44 2345 9999" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Treating Doctor Name</label>
                  <input value={form.treatingDoctorName} onChange={(e) => setForm({...form, treatingDoctorName: e.target.value})}
                    placeholder="Dr. John Smith" className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Section 3 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-sm font-semibold text-gray-700">
                  Upload Your Medical Report <span className="text-red-500 font-normal text-xs">* Required</span>
                </span>
              </div>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
              }`}>
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="app-report" />
                <label htmlFor="app-report" className="cursor-pointer block">
                  {file ? (
                    <div>
                      <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div className="text-emerald-700 font-semibold text-sm">{file.name}</div>
                      <div className="text-xs text-emerald-500 mt-1">{(file.size/1024/1024).toFixed(2)} MB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <div className="text-sm font-medium text-gray-600">Click to upload your medical report</div>
                      <div className="text-xs text-gray-400 mt-1">PDF only · Max 10MB · From your treating hospital</div>
                      <div className="text-xs text-emerald-600 mt-2 font-medium">AI will analyze this with the donor report when matched</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="font-medium text-blue-800 text-sm mb-1">How it works</div>
              <p className="text-xs text-blue-700">
                Submit your application now. When a hospital posts a compatible organ, our AI will automatically analyze both medical reports and notify the doctor for approval. You will be updated at every step.
              </p>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Submitting...</>
                ) : "Submit Application"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* EMPTY STATE — no profile yet */}
      {!showForm && !profile?.organNeeded && applications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <div className="font-medium text-gray-600 mb-1">No application yet</div>
          <div className="text-sm text-gray-400 mb-6">Register your organ need to get started</div>
        </div>
      )}

      {/* REGISTERED — profile exists but no applications yet */}
      {!showForm && profile?.organNeeded && applications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">Application Registered</div>
              <p className="text-sm text-gray-500">
                Your need for a <span className="font-medium text-emerald-700">{profile.organNeeded}</span> has been registered.
                You will be automatically matched when a compatible organ becomes available.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[["Organ Needed", profile.organNeeded], ["Blood Group", profile.bloodGroup], ["Urgency", profile.urgencyLevel]].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <div className="text-sm font-semibold text-gray-800 capitalize">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS LIST */}
      {!showForm && applications.length > 0 && (
        <div className="space-y-6">
          {applications.map((app) => {
            const organStatus = app.organStatus || "Waiting";
            const stageIdx = getStageIndex(organStatus);
            const isRejected = app.status === "rejected";

            return (
              <div key={app._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{app.organListingId?.organType}</span>
                        <span className="text-xs text-gray-500">{app.hospitalId?.name}</span>
                      </div>
                      <div className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleString()}</div>
                    </div>
                    {app.aiAnalysis?.matchScore > 0 && (
                      <div className={`text-base font-bold px-3 py-1.5 rounded-lg border ${
                        app.aiAnalysis.matchScore >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                        app.aiAnalysis.matchScore >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" :
                        "text-red-600 bg-red-50 border-red-200"
                      }`}>
                        {app.aiAnalysis.matchScore}% Match
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejected */}
                {isRejected && (
                  <div className="p-5 bg-red-50">
                    <div className="font-semibold text-red-800 text-sm mb-1">Application Rejected</div>
                    {app.doctorNotes && <p className="text-xs text-red-700">Doctor notes: {app.doctorNotes}</p>}
                  </div>
                )}

                {/* Status Timeline */}
                {!isRejected && (
                  <div className="p-5">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Organ Status</div>
                    <div className="relative">
                      {ORGAN_STAGES.map((stage, i) => {
                        const isDone = i < stageIdx;
                        const isActive = i === stageIdx;
                        return (
                          <div key={stage.key} className="flex gap-4 mb-4 last:mb-0">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                                isDone ? "bg-emerald-500 border-emerald-500 text-white" :
                                isActive ? "bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100" :
                                "bg-white border-gray-200 text-gray-300"
                              }`}>
                                {isDone ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                ) : <span className="text-xs font-bold">{i + 1}</span>}
                              </div>
                              {i < ORGAN_STAGES.length - 1 && (
                                <div className={`w-0.5 h-6 mt-1 ${i < stageIdx ? "bg-emerald-400" : "bg-gray-200"}`}></div>
                              )}
                            </div>
                            <div className="pb-2 flex-1">
                              <div className={`text-sm font-semibold ${isActive ? "text-emerald-700" : isDone ? "text-gray-700" : "text-gray-300"}`}>
                                {stage.label}
                              </div>
                              <div className={`text-xs mt-0.5 ${isActive ? "text-emerald-600" : isDone ? "text-gray-400" : "text-gray-300"}`}>
                                {stage.desc}
                              </div>
                              {(isDone || isActive) && app.organStatusHistory?.find(h => h.status === stage.key) && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(app.organStatusHistory.find(h => h.status === stage.key).updatedAt).toLocaleString()}
                                </div>
                              )}
                              {stage.key === "Approved" && (isDone || isActive) && app.allocationTxHash && (
                                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                  <div className="text-xs text-emerald-600 font-medium mb-0.5">Blockchain Transaction (Immutable)</div>
                                  <code className="text-xs text-emerald-700 break-all">{app.allocationTxHash}</code>
                                </div>
                              )}
                              {(isDone || isActive) && app.organStatusHistory?.find(h => h.status === stage.key)?.note && (
                                <div className="mt-1 text-xs text-gray-500 italic">
                                  {app.organStatusHistory.find(h => h.status === stage.key).note}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {app.aiAnalysis?.matchScore > 0 && (
                  <details className="border-t border-gray-100">
                    <summary className="px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 uppercase tracking-wider">
                      View AI Analysis
                    </summary>
                    <div className="px-5 pb-5 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Blood Compatibility</div>
                          <div className="text-sm text-gray-700">{app.aiAnalysis.bloodCompatibility}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Organ Compatibility</div>
                          <div className="text-sm text-gray-700">{app.aiAnalysis.organCompatibility}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Insights</div>
                        <div className="space-y-1.5">
                          {app.aiAnalysis.keyInsights?.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Medical Summary</div>
                        <div className="text-sm text-blue-800">{app.aiAnalysis.medicalSummary}</div>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
