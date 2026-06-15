import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { useSocket } from "../context/SocketContext";
import { useState } from "react";

const Icons = {
  dashboard:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.8"/></svg>,
  postOrgan:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  request:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4" strokeWidth="1.8"/></svg>,
  review:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  tracking:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" strokeWidth="1.8"/><path strokeWidth="1.8" strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>,
  blockchain: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  wallet:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="17" cy="13" r="1" fill="currentColor"/></svg>,
  logout:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  bell:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
};

const NAV_HOSPITAL = [
  { to: "/hospital-dashboard",  icon: Icons.dashboard,  label: "Dashboard" },
  { to: "/post-organ",          icon: Icons.postOrgan,  label: "Post Available Organ" },
  { to: "/available-organs",    icon: Icons.tracking,   label: "Available Organs" },
  { to: "/post-organ-request",  icon: Icons.request,    label: "Request Organ for Patient" },
  { to: "/recipient-details",   icon: Icons.review,     label: "Recipient Details" },
  { to: "/organ-tracking",      icon: Icons.tracking,   label: "Organ Tracking" },
  { to: "/transaction-history", icon: Icons.blockchain, label: "Transaction Audit" },
];

const NAV_DONOR = [
  { to: "/donor-registration",  icon: Icons.request,    label: "My Donor Profile" },
  { to: "/available-organs",    icon: Icons.tracking,   label: "Available Organs" },
];

const NAV_RECIPIENT = [
  { to: "/recipient-registration", icon: Icons.request, label: "My Profile" },
  { to: "/available-organs",    icon: Icons.tracking,   label: "Available Organs" },
  { to: "/organ-listings",      icon: Icons.postOrgan,  label: "Browse Organs" },
  { to: "/my-applications",     icon: Icons.review,     label: "My Applications" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { account, connectWallet, disconnectWallet } = useWeb3();
  const { notifications, unreadCount, markRead, clearAll } = useSocket();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);

  const handleLogout = () => { logout(); disconnectWallet(); navigate("/login"); };

  const NAV = user?.role === "donor" ? NAV_DONOR : user?.role === "recipient" ? NAV_RECIPIENT : NAV_HOSPITAL;
  const roleLabel = user?.role === "donor" ? "Donor" : user?.role === "recipient" ? "Recipient" : "Hospital";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-gray-900 flex flex-col border-r border-white/5">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">OrganChain</div>
              <div className="text-white/30 text-xs">Hospital Network</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-300 font-semibold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-medium truncate">{user.name}</div>
                <div className="text-white/30 text-xs">{roleLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <div className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-1.5">Menu</div>
          <div className="space-y-0.5">
            {NAV.map((link) => (
              <NavLink key={link.to} to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600/25 text-emerald-300 border border-emerald-600/20"
                      : "text-white/45 hover:bg-white/5 hover:text-white/80"
                  }`
                }>
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Wallet + Logout */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          {user ? (
            <>
              {account ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></span>
                  <span className="text-emerald-300 text-xs font-mono truncate">{account.slice(0, 10)}...{account.slice(-4)}</span>
                </div>
              ) : (
                <button onClick={connectWallet} className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white/80 text-xs font-medium transition-all border border-white/10">
                  {Icons.wallet} Connect Wallet
                </button>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-white/35 hover:text-white/70 text-sm transition-all">
                {Icons.logout} Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-1">
              <NavLink to="/login" className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition-colors">Sign In</NavLink>
              <NavLink to="/register" className="w-full flex items-center justify-center px-4 py-2 bg-white/8 hover:bg-white/12 rounded-lg text-white/70 text-sm font-medium transition-colors">Register</NavLink>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="text-sm font-semibold text-gray-800">Organ Donation & Transplantation Management</div>
            <div className="text-xs text-gray-400 mt-0.5">Blockchain-Powered Hospital Network</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-500 font-medium">Hardhat · Port 8545</span>
            </div>
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button onClick={() => setShowNotif(!showNotif)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                  {Icons.bell}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
                  )}
                </button>
                {showNotif && (
                  <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                      {notifications.length > 0 && <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications</div>}
                      {notifications.map((n) => (
                        <div key={n.id} onClick={() => { markRead(n.id); setShowNotif(false); }}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.read ? "bg-emerald-50" : ""}`}>
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                            <div>
                              <div className="text-sm font-medium text-gray-800">{n.message}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{new Date(n.time).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {user && <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700">{roleLabel.toUpperCase()}</span>}
          </div>
        </header>
        <div className="flex-1 p-6 bg-gray-50/80">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
