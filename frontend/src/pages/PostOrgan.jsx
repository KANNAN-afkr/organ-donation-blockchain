import { useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ORGANS = ["Heart", "Kidney", "Liver", "Lung", "Pancreas", "Cornea", "Bone Marrow"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PostOrgan() {
  const [form, setForm] = useState({ organType: "Kidney", bloodGroup: "O+", donorAge: "", donorGender: "male", medicalCondition: "", additionalNotes: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please upload the donor medical report PDF"); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append("report", file);

      await api.post("/organ-listings", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Organ listing posted. Recipients will be notified.");
      navigate("/hospital-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post organ listing");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Post Available Organ</h1>
        <p className="page-subtitle">Register an organ available for transplantation. Recipients will receive an emergency notification.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="font-medium text-amber-800 text-sm mb-1">Emergency Notification</div>
        <p className="text-xs text-amber-700">Once posted, all registered recipients will receive a real-time notification about this organ availability. Attach the complete donor medical report for AI-assisted matching.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="form-label">Organ Type</label>
            <select name="organType" value={form.organType} onChange={handleChange} className="form-input">
              {ORGANS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Donor Blood Group</label>
            <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="form-input">
              {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Donor Age</label>
            <input type="number" name="donorAge" value={form.donorAge} onChange={handleChange} required placeholder="45" className="form-input" />
          </div>
          <div>
            <label className="form-label">Donor Gender</label>
            <select name="donorGender" value={form.donorGender} onChange={handleChange} className="form-input">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Medical Condition / Cause of Death</label>
            <textarea name="medicalCondition" value={form.medicalCondition} onChange={handleChange} required rows={3}
              placeholder="e.g. Brain death due to road accident. No history of organ disease..." className="form-input resize-none" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Additional Notes <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
            <textarea name="additionalNotes" value={form.additionalNotes} onChange={handleChange} rows={2}
              placeholder="Any additional medical notes..." className="form-input resize-none" />
          </div>

          {/* PDF Upload */}
          <div className="col-span-2">
            <label className="form-label">Donor Medical Report <span className="text-red-500">*</span></label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="organ-report" />
              <label htmlFor="organ-report" className="cursor-pointer">
                {file ? (
                  <div>
                    <div className="text-emerald-600 font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-emerald-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB — Click to change</div>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div className="text-sm font-medium text-gray-600">Click to upload donor medical report</div>
                    <div className="text-xs text-gray-400 mt-1">PDF only, max 10MB</div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Posting & Notifying Recipients...</>
              ) : "Post Organ & Notify Recipients"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
