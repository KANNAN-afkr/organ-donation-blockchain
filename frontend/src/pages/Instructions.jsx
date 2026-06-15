export default function Instructions() {
  const phases = [
    {
      step: 1, color: "yellow", title: "Start Blockchain Node",
      terminal: "Terminal 1 — Keep Open",
      commands: [
        { cmd: "cd organ-donation-blockchain/blockchain", note: "Navigate to blockchain folder" },
        { cmd: "npm install", note: "Install Hardhat dependencies" },
        { cmd: "npx hardhat compile", note: "Compile Solidity smart contract" },
        { cmd: "npx hardhat node", note: "⚠️ Keep this terminal open — local Ethereum on port 8545" },
      ],
    },
    {
      step: 2, color: "orange", title: "Deploy Smart Contract",
      terminal: "Terminal 2 — Run Once",
      commands: [
        { cmd: "cd organ-donation-blockchain/blockchain", note: "Open a NEW terminal" },
        { cmd: "npx hardhat run scripts/deploy.js --network localhost", note: "Deploys contract + auto-copies deployment.json to frontend & backend" },
      ],
    },
    {
      step: 3, color: "blue", title: "Start Backend Server",
      terminal: "Terminal 3 — Keep Open",
      commands: [
        { cmd: "cd organ-donation-blockchain/backend", note: "Open a NEW terminal" },
        { cmd: "npm install", note: "Install Node.js dependencies" },
        { cmd: "node server.js", note: "Starts Express on port 5000 — expect: MongoDB connected" },
      ],
    },
    {
      step: 4, color: "green", title: "Start Frontend",
      terminal: "Terminal 4 — Keep Open",
      commands: [
        { cmd: "cd organ-donation-blockchain/frontend", note: "Open a NEW terminal" },
        { cmd: "npm install", note: "Install React + Tailwind dependencies" },
        { cmd: "npm run dev", note: "Opens at http://localhost:5173" },
      ],
    },
  ];

  const flow = [
    { step: 1, role: "Hospital", action: "Register account with role: Hospital", page: "/register" },
    { step: 2, role: "Donor", action: "Register account with role: Donor", page: "/register" },
    { step: 3, role: "Recipient", action: "Register account with role: Recipient", page: "/register" },
    { step: 4, role: "Donor", action: "Login → fill Donor Registration form", page: "/donor-registration" },
    { step: 5, role: "Recipient", action: "Login → fill Recipient Registration form", page: "/recipient-registration" },
    { step: 6, role: "Hospital", action: "Login → Hospital Dashboard → Approve the donor", page: "/hospital-dashboard" },
    { step: 7, role: "Hospital", action: "Organ Allocation → Match donor with recipient", page: "/organ-allocation" },
    { step: 8, role: "Hospital", action: "Transplant History → Confirm Transplant", page: "/transplant-history" },
  ];

  const colorMap = {
    yellow: { bar: "bg-yellow-400", bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-400 text-yellow-900" },
    orange: { bar: "bg-orange-400", bg: "bg-orange-50 border-orange-200", badge: "bg-orange-500 text-white" },
    blue:   { bar: "bg-blue-500",   bg: "bg-blue-50 border-blue-200",     badge: "bg-blue-600 text-white" },
    green:  { bar: "bg-emerald-500",bg: "bg-emerald-50 border-emerald-200",badge: "bg-emerald-600 text-white" },
  };

  const roleColor = { Hospital: "bg-emerald-100 text-emerald-700", Donor: "bg-blue-100 text-blue-700", Recipient: "bg-rose-100 text-rose-700" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🚀 Setup & Run Guide</h1>
        <p className="page-subtitle">Complete step-by-step instructions to run the full-stack blockchain project</p>
      </div>

      {/* Prerequisites */}
      <div className="bg-slate-900 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2"><span>⚠️</span> Prerequisites</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Node.js v18+", url: "https://nodejs.org", icon: "🟢", sub: "nodejs.org" },
            { name: "MetaMask Extension", url: "https://metamask.io", icon: "🦊", sub: "metamask.io" },
            { name: "MongoDB Atlas", url: "https://cloud.mongodb.com", icon: "🍃", sub: "cloud.mongodb.com" },
          ].map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 rounded-xl p-4 flex items-center gap-3 transition-colors">
              <span className="text-2xl">{r.icon}</span>
              <div>
                <div className="text-white text-sm font-semibold">{r.name}</div>
                <div className="text-slate-400 text-xs">{r.sub}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 4 Terminals Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-8">
        <span className="text-xl mt-0.5">💡</span>
        <div>
          <p className="font-semibold text-blue-800 text-sm">You need 4 terminals open simultaneously</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {["T1: npx hardhat node", "T2: deploy contract (once)", "T3: node server.js", "T4: npm run dev"].map((t) => (
              <code key={t} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-lg">{t}</code>
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {phases.map((p) => {
          const c = colorMap[p.color];
          return (
            <div key={p.step} className={`border rounded-2xl overflow-hidden ${c.bg}`}>
              <div className={`${c.bar} h-1`}></div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`${c.badge} text-xs font-bold px-3 py-1 rounded-full`}>Step {p.step}</span>
                  <div>
                    <div className="font-bold text-slate-800">{p.title}</div>
                    <div className="text-xs text-slate-500">{p.terminal}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {p.commands.map((cmd, i) => (
                    <div key={i} className="bg-slate-900 rounded-xl p-3">
                      <code className="text-green-400 text-xs font-mono block">{cmd.cmd}</code>
                      <div className="text-slate-400 text-xs mt-1">{cmd.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MetaMask Setup */}
      <div className="card mb-8">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span>🦊</span> MetaMask Setup</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="font-semibold text-slate-700 text-sm mb-3">Add Hardhat Network</div>
            <div className="space-y-2 text-xs">
              {[["Network Name", "Hardhat Local"], ["RPC URL", "http://127.0.0.1:8545"], ["Chain ID", "31337"], ["Currency", "ETH"]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <code className="text-slate-800 font-semibold">{v}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="font-semibold text-slate-700 text-sm mb-3">Import Test Account</div>
            <div className="text-xs text-slate-500 mb-2">Copy Account #0 private key from hardhat node terminal:</div>
            <code className="text-xs bg-slate-800 text-green-400 p-2 rounded-lg block break-all">
              0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            </code>
            <div className="text-xs text-slate-400 mt-2">MetaMask → Import Account → Paste key</div>
          </div>
        </div>
      </div>

      {/* App Flow */}
      <div className="card mb-8">
        <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><span>🔄</span> Application Usage Flow</h2>
        <div className="space-y-2">
          {flow.map((s) => (
            <div key={s.step} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <span className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg w-20 text-center flex-shrink-0 ${roleColor[s.role]}`}>{s.role}</span>
              <span className="text-sm text-slate-700 flex-1">{s.action}</span>
              <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex-shrink-0">{s.page}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Ports */}
      <div className="card">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span>🌐</span> Ports & URLs</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { service: "Frontend (React + Vite)", url: "http://localhost:5173", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
            { service: "Backend (Express API)", url: "http://localhost:5000/api", color: "bg-blue-50 border-blue-200 text-blue-800" },
            { service: "Hardhat Blockchain Node", url: "http://127.0.0.1:8545", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
            { service: "MongoDB Atlas", url: "cloud.mongodb.com (remote)", color: "bg-purple-50 border-purple-200 text-purple-800" },
          ].map((p) => (
            <div key={p.service} className={`border rounded-xl p-4 ${p.color}`}>
              <div className="font-semibold text-sm">{p.service}</div>
              <code className="text-xs mt-1 block opacity-75">{p.url}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
