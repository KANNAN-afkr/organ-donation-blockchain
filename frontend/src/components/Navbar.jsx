import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { account, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    disconnectWallet();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <Link to="/" className="text-xl font-bold tracking-wide">
        🫀 OrganChain
      </Link>
      <Link to="/instructions" className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold hover:bg-yellow-300">
        📖 How to Run
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            {user.role === "donor" && (
              <Link to="/donor-registration" className="hover:text-blue-200">Donor Profile</Link>
            )}
            {user.role === "recipient" && (
              <Link to="/recipient-registration" className="hover:text-blue-200">Recipient Profile</Link>
            )}
            {user.role === "hospital" && (
              <Link to="/hospital-dashboard" className="hover:text-blue-200">Dashboard</Link>
            )}
            <Link to="/organ-allocation" className="hover:text-blue-200">Allocations</Link>
            <Link to="/transplant-history" className="hover:text-blue-200">History</Link>
            <Link to="/instructions" className="hover:text-blue-200">Guide</Link>

            {account ? (
              <span className="bg-green-600 px-2 py-1 rounded text-xs">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded text-xs font-semibold"
              >
                Connect Wallet
              </button>
            )}

            <span className="text-blue-200 text-xs">{user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-xs"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-200">Login</Link>
            <Link to="/register" className="bg-white text-blue-800 px-3 py-1 rounded font-semibold hover:bg-blue-100">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
