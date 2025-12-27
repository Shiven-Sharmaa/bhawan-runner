import { useNavigate } from "react-router-dom";

function BhawanSelect() {
  const navigate = useNavigate();

  const bhawans = ["K","Q","gandhi"];

  return (
    <div>
      <h2>Select your Bhawan</h2>

      {bhawans.map((b) => (
        <button
          key={b}
          onClick={() => navigate(`/trips/${b}`)}
          style={{ margin: "8px" }}
        >
          Bhawan {b}
        </button>
      ))}
    </div>
  );
}

export default BhawanSelect;
