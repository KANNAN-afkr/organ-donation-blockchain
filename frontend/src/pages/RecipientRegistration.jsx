import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

export default function RecipientRegistration() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", fatherName: "", contactNumber: "", address: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/recipients/me").then((r) => {
      setProfile(r.data);
      setForm({
        name: r.data.name || "",
        fatherName: r.data.fatherName || "",
        contactNumber: r.data.contactNumber || "",
        address: r.data.address || "",
      });
    }).catch(() => setEditing(true));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/recipients/profile", form);
      setProfile(data.recipient);
      setEditing(false);
      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your personal details</p>
      </div>

      {/* Empty state */}
      {!profile && !editing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <div className="font-medium text-gray-600 mb-1">No profile yet</div>
          <div className="text-sm text-gray-400 mb-5">Fill in your details to get started</div>
          <button onClick={() => setEditing(true)} className="btn-primary">Fill Your Details</button>
        </div>
      )}

      {/* Form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Personal Details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  required placeholder="John Doe" className="form-input" />
              </div>
              <div>
                <label className="form-label">Father's Name</label>
                <input value={form.fatherName} onChange={(e) => setForm({...form, fatherName: e.target.value})}
                  required placeholder="Robert Doe" className="form-input" />
              </div>
              <div>
                <label className="form-label">Contact Number</label>
                <input value={form.contactNumber} onChange={(e) => setForm({...form, contactNumber: e.target.value})}
                  required placeholder="+91 98765 43210" className="form-input" />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
                  required placeholder="City, State" className="form-input" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Profile"}
              </button>
              {profile && <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Profile display */}
      {profile && !editing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800">Personal Details</h2>
            <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              ["Full Name", profile.name],
              ["Father's Name", profile.fatherName],
              ["Contact Number", profile.contactNumber],
              ["Address", profile.address],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-900">{value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
