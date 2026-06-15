import { useState, useEffect } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { toast } from "react-toastify";

const ORGANS = ["Heart", "Kidney", "Liver", "Lung", "Pancreas", "Cornea", "Bone Marrow"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const initialForm = { name: "", age: "", bloodType: "A+", organType: "Kidney", contactNumber: "", address: "", medicalHistory: "" };

export default function DonorRegistration() {
  const [form, setForm] = useState(initialForm);
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/donors/me").then((r) => setDonor(r.data)).catch(() => {}); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/donors", form);
      setDonor(data.donor);
      toast.success(data.txHash ? `Registered on blockchain. TX: ${data.txHash.slice(0, 16)}...` : "Registered successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  if (donor) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Donor Profile</h1>
          <p className="page-subtitle">Your organ donation registration details</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Approval Status",   value: <StatusBadge status={donor.isApproved ? "approved" : "pending"} /> },
            { label: "Allocation Status", value: <StatusBadge status={donor.isAllocated ? "confirmed" : "pending"} /> },
            { label: "Organ Type",        value: <span className="font-medium text-gray-900">{donor.organType}</span> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">{s.label}</div>
              <div>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 text-sm mb-5 pb-3 border-b border-gray-100">Personal Information</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[["Full Name", donor.name], ["Age", donor.age], ["Blood Type", donor.bloodType], ["Contact", donor.contactNumber], ["Address", donor.address]].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{k}</div>
                <div className="font-medium text-gray-900">{v}</div>
              </div>
            ))}
            {donor.medicalHistory && (
              <div className="col-span-2">
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Medical History</div>
                <div className="font-medium text-gray-900">{donor.medicalHistory}</div>
              </div>
            )}
          </div>
          {donor.blockchainTxHash && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Blockchain Transaction Hash</div>
              <code className="text-xs text-emerald-600 break-all">{donor.blockchainTxHash}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Donor Registration</h1>
        <p className="page-subtitle">Register as an organ donor — your details will be recorded on the Ethereum blockchain</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
          <div className="text-sm font-medium text-emerald-800 mb-1">Blockchain Registration</div>
          <p className="text-xs text-emerald-700">Upon registration, a blockchain transaction will be created on Ethereum to permanently record your donor commitment.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          <div>
            <label className="form-label">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" className="form-input" />
          </div>
          <div>
            <label className="form-label">Age</label>
            <input type="number" name="age" value={form.age} onChange={handleChange} required placeholder="25" className="form-input" />
          </div>
          <div>
            <label className="form-label">Blood Type</label>
            <select name="bloodType" value={form.bloodType} onChange={handleChange} className="form-input">
              {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Organ to Donate</label>
            <select name="organType" value={form.organType} onChange={handleChange} className="form-input">
              {ORGANS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Contact Number</label>
            <input name="contactNumber" value={form.contactNumber} onChange={handleChange} required placeholder="+1 234 567 8900" className="form-input" />
          </div>
          <div>
            <label className="form-label">Address</label>
            <input name="address" value={form.address} onChange={handleChange} required placeholder="City, Country" className="form-input" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Medical History <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
            <textarea name="medicalHistory" value={form.medicalHistory} onChange={handleChange} rows={3}
              placeholder="Any relevant medical conditions..." className="form-input resize-none" />
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Recording on Blockchain...</> : "Register as Donor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
