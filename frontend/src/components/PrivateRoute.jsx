import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <svg className="animate-spin w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // If a specific role is required and user doesn't have it, redirect to home
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
}
