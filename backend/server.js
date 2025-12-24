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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
