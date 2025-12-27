import { Routes, Route } from "react-router-dom";
import BhawanSelect from "./BhawanSelect";

function App() {
  return (
    <Routes>
      <Route path="/" element={<BhawanSelect />} />
      <Route path="/trips/:bhawan" element={<div>Trips page</div>} />
    </Routes>
  );
}

export default App;
