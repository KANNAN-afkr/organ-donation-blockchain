import { useState, useEffect } from "react";
import api from "../services/api";

export default function OrganListings() {
  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/organ-listings").then((r) => setListings(r.data)).catch(() => {});
  }, []);

  if (selected) {
    return (
      <div className="space-y-6 max-w-3xl">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Back to Available Organs
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-lg border border-emerald-200">
                  {selected.organType}
                </span>
                <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-lg">
                  Blood: {selected.bloodGroup}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Available
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selected.hospitalId?.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{selected.hospitalId?.address}</p>
              <p className="text-xs text-gray-400 mt-0.5">Contact: {selected.hospitalId?.contactNumber}</p>
            </div>
          </div>

          {/* Donor Details */}
          <div className="border-t border-gray-100 pt-5 mb-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Donor Information</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                ["Age", selected.donorAge],
                ["Gender", selected.donorGender?.charAt(0).toUpperCase() + selected.donorGender?.slice(1)],
                ["Blood Group", selected.bloodGroup],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-gray-800">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Condition */}
          <div className="border-t border-gray-100 pt-5 mb-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Medical Condition</div>
            <p className="text-sm text-gray-700 leading-relaxed">{selected.medicalCondition}</p>
            {selected.additionalNotes && (
              <p className="text-xs text-gray-500 mt-2">{selected.additionalNotes}</p>
            )}
          </div>

          {/* Download Report */}
          {selected.reportFileId && (
            <div className="border-t border-gray-100 pt-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Donor Medical Report</div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <svg className="w-8 h-8 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-emerald-800">Donor Medical Report PDF</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Download and share with your treating doctor for review</div>
                </div>
                <a href={`${import.meta.env.VITE_API_URL}/organ-listings/report/${selected.reportFileId}`}
                  target="_blank" rel="noreferrer"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/organ-listings/report/${selected.reportFileId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = selected.reportFileName || 'donor-report.pdf';
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch { alert('Download failed'); }
                  }}
                  className="btn-primary text-sm px-4 py-2">
                  Download PDF
                </a>
              </div>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Posted {new Date(selected.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Available Organs</h1>
        <p className="page-subtitle">Organs currently available for transplantation. Click to view details and download medical reports.</p>
      </div>

      {listings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <div className="font-medium text-gray-600 mb-1">No organs available right now</div>
          <div className="text-sm text-gray-400">You will be notified when an organ becomes available</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {listings.map((l) => (
          <button key={l._id} onClick={() => setSelected(l)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-lg border border-emerald-200">
                    {l.organType}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md">
                    Blood: {l.bloodGroup}
                  </span>
                  <span className="text-xs text-gray-400">Donor age: {l.donorAge}</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Available
                  </span>
                </div>
                <div className="font-semibold text-gray-900">{l.hospitalId?.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l.hospitalId?.address}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-1">{l.medicalCondition}</div>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {l.reportFileId && (
                  <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-md font-medium">
                    Report Available
                  </span>
                )}
                <svg className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
