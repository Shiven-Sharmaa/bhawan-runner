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



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
