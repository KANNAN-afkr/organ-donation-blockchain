import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleCards = {
  recipient: [
    { title: "My Profile",       desc: "Complete your recipient profile with medical details and diagnosis report.", to: "/recipient-registration" },
    { title: "Available Organs", desc: "Browse organs posted by hospitals. Download medical reports and apply.",    to: "/organ-listings" },
    { title: "My Applications",  desc: "Track the status of your organ transplant applications and AI analysis.",   to: "/my-applications" },
  ],
  hospital: [
    { title: "Hospital Dashboard",   desc: "Overview of organ listings, applications, and transplant activity.",        to: "/hospital-dashboard" },
    { title: "Post Available Organ", desc: "Register an organ available for transplantation with medical report.",       to: "/post-organ" },
    { title: "Application Review",   desc: "Review AI-analyzed recipient applications and approve allocations.",         to: "/application-review" },
  ],
};

export default function Home() {
  const { user } = useAuth();
  const cards = user ? (roleCards[user.role] || []) : [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gray-900 rounded-xl p-8 text-white">
        <div className="max-w-2xl">
          <div className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
            AI + Blockchain Healthcare Platform
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {user ? `Welcome back, ${user.name}` : "Organ Donation & Transplantation Management"}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Hospitals post available organs. Recipients apply with medical reports. AI analyzes compatibility. Doctors approve. Blockchain records it permanently.
          </p>
          {!user && (
            <div className="flex gap-3 mt-5">
              <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">Get Started</Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/15 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">Sign In</Link>
            </div>
          )}
        </div>
      </div>

      {/* Flow Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { step: "1", title: "Hospital Posts Organ",  desc: "With donor medical report PDF" },
          { step: "2", title: "Recipients Notified",   desc: "Real-time emergency notification" },
          { step: "3", title: "Recipient Applies",     desc: "With their medical report PDF" },
          { step: "4", title: "AI Analyzes Reports",   desc: "Groq AI reads both PDFs" },
          { step: "5", title: "Doctor Approves",       desc: "Blockchain records — immutable" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs font-bold mb-3">{s.step}</div>
            <div className="font-semibold text-gray-800 text-sm mb-1">{s.title}</div>
            <div className="text-xs text-gray-400 leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {user && cards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => (
              <Link key={c.title} to={c.to} className="card hover:border-emerald-300 hover:shadow-md transition-all group">
                <div className="font-semibold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors text-sm">{c.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{c.desc}</div>
                <div className="mt-3 text-xs text-emerald-600 font-medium group-hover:underline">Open &rarr;</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
