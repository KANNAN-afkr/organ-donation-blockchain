import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { ...form, role: "hospital" });
      login(data);
      toast.success("Account created successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-emerald-950">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <span className="text-white font-semibold">OrganChain</span>
        </div>
        <div>
          <div className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">Hospital Network</div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">Register Your Hospital<br />Join the Network</h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            Post available organs, request organs for your patients, and coordinate transplants with AI-assisted matching across hospitals.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { label: "Post Available Organs", desc: "Register organs available for transplantation" },
              { label: "Request Organs for Patients", desc: "Post patient needs with medical reports" },
              { label: "AI-Assisted Matching", desc: "Groq AI analyzes both medical reports" },
              { label: "Blockchain Records", desc: "Every allocation permanently recorded" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="text-white/80 text-sm font-medium">{f.label}</div>
                  <div className="text-white/40 text-xs">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/20 text-xs">OrganChain &copy; 2024</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Register Hospital</h1>
          <p className="text-gray-500 text-sm mb-8">Create your hospital account to get started</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                required placeholder="Dr. John Smith" className="form-input" />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                required placeholder="you@hospital.com" className="form-input" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                required placeholder="Minimum 6 characters" className="form-input" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50">
              {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating...</> : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
