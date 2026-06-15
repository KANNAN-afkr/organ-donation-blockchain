import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      toast.success("Signed in successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-emerald-950">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-base">OrganChain</span>
        </div>
        <div>
          <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Blockchain Healthcare Platform</div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
            Transparent Organ Donation<br />Powered by Ethereum
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            A secure, tamper-proof organ donation and transplantation management system built on Ethereum smart contracts with MongoDB.
          </p>
          <div className="mt-10 space-y-3">
            {[
              { label: "Smart Contract Automation", desc: "Organ matching via Solidity smart contracts" },
              { label: "Immutable Audit Trail", desc: "Every transaction permanently recorded on-chain" },
              { label: "Role-Based Access", desc: "Donors, recipients, and hospitals with JWT auth" },
              { label: "Real-time Lifecycle Tracking", desc: "Track organs from registration to transplant" },
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
        <div className="text-white/20 text-xs">Organ Donation Blockchain System &copy; 2024</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white/90">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the platform</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@example.com" className="form-input" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required
                placeholder="Enter your password" className="form-input" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-emerald-600 font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
