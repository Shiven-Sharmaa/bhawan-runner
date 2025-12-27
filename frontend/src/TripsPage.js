import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function TripsPage() {
  const { bhawan } = useParams();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [runnerName, setRunnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTrips = () => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/trips/${bhawan}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch trips");
        }
        return res.json();
      })
      .then((data) => {
        setTrips(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrips();
  }, [bhawan]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!runnerName || !shopName || !departureTime) {
      alert("All fields are required");
      return;
    }

    setSubmitting(true);

    fetch("http://localhost:5000/trips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runner_name: runnerName,
        shop_name: shopName,
        departure_time: departureTime,
        bhawan,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create trip");
        }
        return res.json();
      })
      .then(() => {
        // Reset form
        setRunnerName("");
        setShopName("");
        setDepartureTime("");

        // Refresh trips list
        fetchTrips();
      })
      .catch((err) => {
        alert(err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
    };
    
    const handleCloseTrip = (tripId) => {
    const confirmClose = window.confirm(
        "Are you sure you want to close this trip?"
    );

    if (!confirmClose) return;

    fetch(`http://localhost:5000/trips/${tripId}/close`, {
        method: "PATCH",
    })
        .then((res) => {
        if (!res.ok) {
            throw new Error("Failed to close trip");
        }
        return res.json();
        })
        .then(() => {
        // Refresh trips list after closing
        fetchTrips();
        })
        .catch((err) => {
        alert(err.message);
        });
    };


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
    Departure: {new Date(trip.departure_time).toLocaleString()}
    <br />
    <button onClick={() => handleCloseTrip(trip.id)}>
        Close Trip
    </button>
    </li>
    ))}
    </ul>

    </div>
  );
}

export default TripsPage;
