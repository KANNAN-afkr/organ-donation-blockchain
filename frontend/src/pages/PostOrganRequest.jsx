import { useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ORGANS = ["Heart", "Kidney", "Liver", "Lung", "Pancreas", "Cornea", "Bone Marrow"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PostOrganRequest() {
  const [form, setForm] = useState({
    patientName: "", patientAge: "", patientGender: "male",
    bloodGroup: "A+", organNeeded: "Kidney", urgencyLevel: "medium",
    diagnosis: "", treatingDoctorName: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please upload the patient medical report PDF"); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append("report", file);
      await api.post("/organ-requests", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Organ request posted. Other hospitals will be notified.");
      navigate("/hospital-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post request");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Request Organ for Patient</h1>
        <p className="page-subtitle">Post your patient's organ need. Other hospitals with available organs will be notified.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="font-medium text-blue-800 text-sm mb-1">Emergency Notification</div>
        <p className="text-xs text-blue-700">Once posted, all registered hospitals will receive a real-time notification about this organ request. Attach the patient's complete medical report for AI-assisted matching.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Patient Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-sm font-semibold text-gray-700">Patient Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Patient Name</label>
                <input value={form.patientName} onChange={(e) => setForm({...form, patientName: e.target.value})}
                  required placeholder="John Doe" className="form-input" />
              </div>
              <div>
                <label className="form-label">Patient Age</label>
                <input type="number" value={form.patientAge} onChange={(e) => setForm({...form, patientAge: e.target.value})}
                  required placeholder="45" className="form-input" />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select value={form.patientGender} onChange={(e) => setForm({...form, patientGender: e.target.value})} className="form-input">
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
                <label className="form-label">Treating Doctor</label>
                <input value={form.treatingDoctorName} onChange={(e) => setForm({...form, treatingDoctorName: e.target.value})}
                  placeholder="Dr. Smith" className="form-input" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Medical Need */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-sm font-semibold text-gray-700">Medical Need</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="sm:col-span-2">
                <label className="form-label">Medical Diagnosis</label>
                <textarea value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})}
                  required rows={3} placeholder="Describe patient's condition and why they need this organ..."
                  className="form-input resize-none" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* PDF Upload */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-sm font-semibold text-gray-700">Patient Medical Report <span className="text-red-500 font-normal text-xs">* Required</span></span>
            </div>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"}`}>
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="patient-report" />
              <label htmlFor="patient-report" className="cursor-pointer block">
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
                    <div className="text-sm font-medium text-gray-600">Click to upload patient medical report</div>
                    <div className="text-xs text-gray-400 mt-1">PDF only · Max 10MB</div>
                    <div className="text-xs text-emerald-600 mt-2 font-medium">AI will analyze this with donor reports for matching</div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Posting Request...</>
            ) : "Post Organ Request & Notify Hospitals"}
          </button>
        </form>
      </div>
    </div>
  );
}
