require("dotenv").config({ path: "../.env" });

const express = require("express");
const pool = require("./db/pool"); // now env vars exist

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      db_time: result.rows[0].now,
    });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(500).json({ status: "error" });
  }
});

app.get("/trips", async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        runner_name,
        shop_name,
        departure_time,
        status,
        created_at
      FROM trips
      WHERE status = 'open'
      ORDER BY departure_time ASC
    `;

    const result = await pool.query(query);

    // Always return an array (empty is valid)
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Failed to fetch trips:", err.message);

    res.status(500).json({
      error: "Failed to fetch trips",
    });
  }
});

app.post("/trips", async (req, res) => {
  try {
    const { runner_name, shop_name, departure_time } = req.body;

    // 1️⃣ Basic validation (trust nothing from client)
    if (!runner_name || !shop_name || !departure_time) {
      return res.status(400).json({
        error: "runner_name, shop_name, and departure_time are required",
      });
    }

    // 2️⃣ Insert query (parameterized → SQL injection safe)
    const query = `
      INSERT INTO trips (runner_name, shop_name, departure_time, status)
      VALUES ($1, $2, $3, 'open')
      RETURNING
        id,
        runner_name,
        shop_name,
        departure_time,
        status,
        created_at
    `;

    const values = [runner_name, shop_name, departure_time];

    const result = await pool.query(query, values);

    // 3️⃣ Return the created trip
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create trip:", err.message);

    res.status(500).json({
      error: "Failed to create trip",
    });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
