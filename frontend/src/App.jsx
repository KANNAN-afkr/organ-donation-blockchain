import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Web3Provider } from "./context/Web3Context";
import { SocketProvider } from "./context/SocketContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HospitalDashboard from "./pages/HospitalDashboard";
import PostOrgan from "./pages/PostOrgan";
import PostOrganRequest from "./pages/PostOrganRequest";
import RecipientDetails from "./pages/RecipientDetails";
import AvailableOrgans from "./pages/AvailableOrgans";
import OrganTracking from "./pages/OrganTracking";
import TransactionHistory from "./pages/TransactionHistory";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<PrivateRoute><HospitalDashboard /></PrivateRoute>} />
                <Route path="hospital-dashboard"  element={<PrivateRoute><HospitalDashboard /></PrivateRoute>} />
                <Route path="post-organ"          element={<PrivateRoute><PostOrgan /></PrivateRoute>} />
                <Route path="post-organ-request"  element={<PrivateRoute><PostOrganRequest /></PrivateRoute>} />
                <Route path="available-organs"    element={<PrivateRoute><AvailableOrgans /></PrivateRoute>} />
                <Route path="recipient-details"   element={<PrivateRoute><RecipientDetails /></PrivateRoute>} />
                <Route path="organ-tracking"      element={<PrivateRoute><OrganTracking /></PrivateRoute>} />
                <Route path="transaction-history" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </Web3Provider>
    </AuthProvider>
  );
}
