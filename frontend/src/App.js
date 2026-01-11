import { Routes, Route } from "react-router-dom";
import BhawanSelect from "./BhawanSelect";
import TripsPage from "./TripsPage";
import LoginPage from "./LoginPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<BhawanSelect />} />
      <Route path="/trips/:bhawan" element={<TripsPage />} />
    </Routes>
  );
}

export default App;
