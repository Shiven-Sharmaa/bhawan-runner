import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";

function TripsPage() {
  const { bhawan } = useParams();
  const { token, user } = useAuth();


  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [runnerName, setRunnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---------- Fetch trips (public) ----------
  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(
        `http://localhost:5000/trips/${bhawan}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch trips");
      }

      const data = await res.json();
      setTrips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [bhawan]);

  // ---------- Create trip (authenticated) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!runnerName || !shopName || !departureTime) {
      alert("All fields are required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await apiFetch(
        "http://localhost:5000/trips",
        {
          method: "POST",
          body: JSON.stringify({
            runner_name: runnerName,
            shop_name: shopName,
            departure_time: departureTime,
            bhawan,
          }),
        },
        token
      );

      if (!res.ok) {
        throw new Error("Failed to create trip");
      }

      // Reset form
      setRunnerName("");
      setShopName("");
      setDepartureTime("");

      // Refresh list
      fetchTrips();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Close trip (authenticated) ----------
  const handleCloseTrip = async (tripId) => {
    const confirmClose = window.confirm(
      "Are you sure you want to close this trip?"
    );
    if (!confirmClose) return;

    try {
      const res = await apiFetch(
        `http://localhost:5000/trips/${tripId}/close`,
        { method: "PATCH" },
        token
      );

      if (!res.ok) {
        throw new Error("Failed to close trip");
      }

      fetchTrips();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Render ----------
  return (
    <div>
      <h2>Open Trips — Bhawan {bhawan}</h2>

      <h3>Create Trip</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Runner name"
            value={runnerName}
            onChange={(e) => setRunnerName(e.target.value)}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Shop name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </div>

        <div>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Trip"}
        </button>
      </form>

      <hr />

      {loading && <div>Loading trips…</div>}
      {error && <div>Error: {error}</div>}

      {!loading && trips.length === 0 && (
        <div>No open trips for this bhawan</div>
      )}

      <ul>
        {trips.map((trip) => (
          <li key={trip.id}>
            <strong>{trip.runner_name}</strong> → {trip.shop_name}
            <br />
            Departure:{" "}
            {new Date(trip.departure_time).toLocaleString()}
            <br />
            {user && trip.creator_id === user.id && (
              <button onClick={() => handleCloseTrip(trip.id)}>
                Close Trip
              </button>
            )}
          </li> 
        ))}
      </ul>
    </div>
  );
}

export default TripsPage;
