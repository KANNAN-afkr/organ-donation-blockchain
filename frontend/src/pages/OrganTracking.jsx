import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { useSocket } from "../context/SocketContext";

const STAGES = ["Approved", "InTransit", "NearbyHospital", "Delivered", "Completed"];

const STAGE_CONFIG = {
  Approved:       { label: "Organ Allocated",           color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  InTransit:      { label: "Organ In Transit",          color: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  NearbyHospital: { label: "Nearby Recipient Hospital", color: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  Delivered:      { label: "Organ Delivered",           color: "bg-orange-500",  text: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
  Completed:      { label: "Transplant Done",           color: "bg-teal-500",    text: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200" },
};

const QUICK_MESSAGES = [
  "Organ is under clearance",
  "Organ is being prepared for transport",
  "Organ dispatched via air transport",
  "Organ in transit — ETA 2 hours",
  "Organ arrived at city limits",
  "Organ handed over to recipient team",
  "Transplant surgery in progress",
];

export default function OrganTracking() {
  const { socket } = useSocket();
  const [applications, setApplications] = useState([]);
  const [myHospital, setMyHospital] = useState(null);
  const [selected, setSelected] = useState(null);
  const [customMsg, setCustomMsg] = useState("");
  const [updating, setUpdating] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchAll = useCallback(() => {
    api.get("/organ-applications")
      .then((r) => {
        const approved = r.data.filter((a) => a.status === "approved");
        setApplications(approved);
        setSelected((prev) => {
          if (!prev) return prev;
          return approved.find((a) => a._id === prev._id) || prev;
        });
      }).catch(() => {});
    api.get("/hospitals/me").then((r) => setMyHospital(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Live socket updates for selected application
  useEffect(() => {
    if (!socket || !selected) return;
    const handler = (data) => {
      if (data.applicationId !== selected._id) return;
      setSelected((prev) => ({
        ...prev,
        organStatus: data.organStatus || prev.organStatus,
        organStatusHistory: data.organStatusHistory || prev.organStatusHistory,
      }));
      setApplications((prev) =>
        prev.map((a) => a._id === data.applicationId ? { ...a, organStatus: data.organStatus || a.organStatus } : a)
      );
      const label = STAGE_CONFIG[data.organStatus]?.label || data.organStatus;
      toast.info(`${label}${data.note ? ` — ${data.note}` : ""}`, { autoClose: 5000 });
    };
    socket.on(`application_${selected._id}`, handler);
    return () => socket.off(`application_${selected._id}`, handler);
  }, [socket, selected?._id]);

  // Is this hospital the provider (organ giver) or requester (organ receiver)?
  const isProvider = myHospital && selected &&
    (selected.providingHospitalId?._id === myHospital._id ||
     selected.providingHospitalId === myHospital._id);

  const currentStageIdx = (app) => {
    const idx = STAGES.indexOf(app?.organStatus);
    return idx === -1 ? 0 : idx;
  };

  const nextStage = (app) => {
    const idx = currentStageIdx(app);
    return idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const { data } = await api.patch(`/organ-applications/${selected._id}/organ-status`, {
        organStatus: newStatus, note: "",
      });
      setSelected(data.application);
      toast.success(`Marked as "${STAGE_CONFIG[newStatus]?.label}"`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setUpdating(false); }
  };

  const sendCustomMessage = async (msg) => {
    if (!msg.trim()) return;
    setSendingMsg(true);
    try {
      const { data } = await api.patch(`/organ-applications/${selected._id}/organ-status`, {
        customMessage: msg,
      });
      setSelected(data.application);
      setCustomMsg("");
      toast.success("Message sent to recipient hospital");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally { setSendingMsg(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Organ Tracking</h1>
        <p className="page-subtitle">
          Live tracking of all approved organ allocations. Both providing and requesting hospitals see every update instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Application List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Approved Allocations</h3>
            <p className="text-xs text-gray-400 mt-0.5">{applications.length} active · click to track</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {applications.length === 0 && (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                No approved allocations yet.<br/>
                <span className="text-xs">Allocate an organ from Recipient Details first.</span>
              </div>
            )}
            {applications.map((app) => {
              const iAmProvider = myHospital && (app.providingHospitalId?._id === myHospital._id || app.providingHospitalId === myHospital._id);
              const cfg = STAGE_CONFIG[app.organStatus] || STAGE_CONFIG.Approved;
              return (
                <button key={app._id} onClick={() => { setSelected(app); setCustomMsg(""); }}
                  className={`w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors ${selected?._id === app._id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{app.organRequestId?.patientName || "—"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{app.organListingId?.organType} · {app.organRequestId?.bloodGroup}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {app.providingHospitalId?.name} → {app.requestingHospitalId?.name}
                  </div>
                  <div className={`text-xs mt-1 font-medium ${iAmProvider ? "text-emerald-600" : "text-blue-600"}`}>
                    {iAmProvider ? "You are providing" : "You are receiving"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Tracking Detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="text-5xl mb-4">🫀</div>
              <div className="font-medium text-gray-500">Select an allocation to track</div>
              <div className="text-xs mt-1 text-gray-400">Live updates will appear here instantly</div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Role Banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isProvider ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isProvider ? "bg-emerald-500" : "bg-blue-500"}`}></span>
                <div>
                  <div className={`text-sm font-semibold ${isProvider ? "text-emerald-800" : "text-blue-800"}`}>
                    {isProvider ? `You are the Providing Hospital — update organ status below` : `You are the Receiving Hospital — live updates from ${selected.providingHospitalId?.name}`}
                  </div>
                  <div className={`text-xs mt-0.5 ${isProvider ? "text-emerald-600" : "text-blue-600"}`}>
                    {isProvider ? `Recipient: ${selected.requestingHospitalId?.name}` : `Provider: ${selected.providingHospitalId?.name}`}
                  </div>
                </div>
              </div>

              {/* Patient + Organ Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="font-semibold text-gray-900 mb-3">{selected.organRequestId?.patientName || "—"}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    ["Organ",         selected.organListingId?.organType],
                    ["Blood Group",   selected.organRequestId?.bloodGroup],
                    ["Urgency",       selected.organRequestId?.urgencyLevel],
                    ["From Hospital", selected.providingHospitalId?.name],
                    ["To Hospital",   selected.requestingHospitalId?.name],
                    ["Doctor",        selected.organRequestId?.treatingDoctorName || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                      <div className="text-sm font-medium text-gray-800 capitalize">{value || "—"}</div>
                    </div>
                  ))}
                </div>
                {selected.allocationTxHash && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="text-xs text-emerald-600 font-medium mb-0.5">Blockchain TX (Immutable)</div>
                    <code className="text-xs text-emerald-700 break-all">{selected.allocationTxHash}</code>
                  </div>
                )}
              </div>

              {/* Journey Progress */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="font-semibold text-gray-700 text-sm mb-5">Organ Journey</h4>
                {/* Desktop journey bar */}
                <div className="hidden sm:flex items-center">
                  {STAGES.map((stage, i) => {
                    const idx = currentStageIdx(selected);
                    const done = i <= idx;
                    const active = i === idx;
                    const cfg = STAGE_CONFIG[stage];
                    return (
                      <div key={stage} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                            done ? `${cfg.color} border-transparent text-white` : "bg-white border-gray-200 text-gray-300"
                          } ${active ? "ring-4 ring-offset-2 ring-emerald-200 scale-110" : ""}`}>
                            {done && i < idx ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : i + 1}
                          </div>
                          <div className={`text-xs mt-2 font-medium text-center leading-tight ${done ? "text-gray-700" : "text-gray-300"}`}>
                            {cfg.label}
                          </div>
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-1 mb-6 ${i < idx ? "bg-emerald-400" : "bg-gray-200"}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Mobile journey list */}
                <div className="flex flex-col gap-2 sm:hidden">
                  {STAGES.map((stage, i) => {
                    const idx = currentStageIdx(selected);
                    const done = i <= idx;
                    const active = i === idx;
                    const cfg = STAGE_CONFIG[stage];
                    return (
                      <div key={stage} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                        active ? `${cfg.bg} ${cfg.border}` : done ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0 ${
                          done ? `${cfg.color} border-transparent text-white` : "bg-white border-gray-200 text-gray-300"
                        }`}>
                          {done && i < idx ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          ) : i + 1}
                        </div>
                        <span className={`text-sm font-medium ${done ? cfg.text : "text-gray-300"}`}>{cfg.label}</span>
                        {active && <span className="ml-auto text-xs font-semibold text-emerald-600">Current</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status History — visible to BOTH hospitals */}
              {selected.organStatusHistory?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="font-semibold text-gray-700 text-sm mb-4">Live Updates</h4>
                  <div className="space-y-3">
                    {[...selected.organStatusHistory].reverse().map((h, i) => {
                      const cfg = STAGE_CONFIG[h.status];
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg?.color || "bg-gray-400"}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-800">{cfg?.label || h.status}</div>
                              <div className="text-xs text-gray-400">{new Date(h.updatedAt).toLocaleString()}</div>
                            </div>
                            {h.note && (
                              <div className="text-xs text-gray-600 mt-1 bg-gray-50 border border-gray-100 rounded-md px-2 py-1.5">
                                💬 {h.note}
                                {h.updatedBy && <span className="text-gray-400 ml-1">— {h.updatedBy}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PROVIDING HOSPITAL — update controls */}
              {isProvider && selected.organStatus !== "Completed" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                  <h4 className="font-semibold text-gray-700 text-sm">Update Status</h4>

                  {/* Predefined next stage */}
                  {nextStage(selected) && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Next Stage</div>
                      <button onClick={() => updateStatus(nextStage(selected))} disabled={updating}
                        className="btn-primary w-full justify-center">
                        {updating ? (
                          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Updating...</>
                        ) : `Mark as "${STAGE_CONFIG[nextStage(selected)]?.label}"`}
                      </button>
                    </div>
                  )}

                  {/* Quick messages */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Messages</div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_MESSAGES.map((msg) => (
                        <button key={msg} onClick={() => sendCustomMessage(msg)} disabled={sendingMsg}
                          className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-gray-600">
                          {msg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom message */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Message</div>
                    <div className="flex gap-2">
                      <input value={customMsg} onChange={(e) => setCustomMsg(e.target.value)}
                        placeholder="Type a custom update for the recipient hospital..."
                        className="form-input flex-1"
                        onKeyDown={(e) => e.key === "Enter" && sendCustomMessage(customMsg)} />
                      <button onClick={() => sendCustomMessage(customMsg)} disabled={sendingMsg || !customMsg.trim()}
                        className="btn-primary px-4 flex-shrink-0">
                        {sendingMsg ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      All updates are visible to <strong>{selected.requestingHospitalId?.name}</strong> instantly via live connection.
                    </p>
                  </div>
                </div>
              )}

              {/* REQUESTING HOSPITAL — view only */}
              {!isProvider && selected.organStatus !== "Completed" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="font-medium text-blue-800 text-sm mb-1">
                    Waiting for updates from {selected.providingHospitalId?.name}
                  </div>
                  <p className="text-xs text-blue-700">
                    Next expected: <strong>{STAGE_CONFIG[nextStage(selected)]?.label || "Final stage"}</strong>.
                    Updates appear here the moment they are posted.
                  </p>
                </div>
              )}

              {selected.organStatus === "Completed" && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-semibold text-teal-800 mb-1">Transplant Completed</div>
                  <p className="text-xs text-teal-700">
                    The organ transplant has been successfully completed. All records are permanently stored on the blockchain.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
