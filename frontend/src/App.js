import { Routes, Route, Link, useNavigate } from "react-router-dom";
import BhawanSelect from "./BhawanSelect";
import TripsPage from "./TripsPage";
import LoginPage from "./LoginPage";
import { useAuth } from "./AuthContext";

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ marginBottom: "20px" }}>
        {isAuthenticated ? (
          <>
            <span style={{ marginRight: "10px" }}>
              Logged in as <strong>{user.name}</strong>
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<BhawanSelect />} />
        <Route path="/trips/:bhawan" element={<TripsPage />} />
      </Routes>
    </div>
  );
}

export default App;
