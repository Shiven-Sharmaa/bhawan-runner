require("dotenv").config({ path: "../.env" });

const cors = require("cors");

const express = require("express");
const pool = require("./db/pool"); // now env vars exist

const app = express();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/auth");

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PATCH"],
}));


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

    // 2️⃣ Query filtered by bhawan + open trips only
    const query = `
      SELECT
        id,
        runner_name,
        shop_name,
        departure_time,
        status,
        created_at,
        bhawan
      FROM trips
      WHERE status = 'open'
      ORDER BY departure_time ASC
    `;

    const result = await pool.query(query);

    // 3️⃣ Always return an array
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Failed to fetch trips:", err.message);

    res.status(500).json({
      error: "Failed to fetch trips",
    });
  }
});

app.get("/trips/:bhawan", async (req, res) => {
  try {
    const { bhawan } = req.params;

    // 1️⃣ Validate query param
    if (!bhawan) {
      return res.status(400).json({
        error: "bhawan query parameter is required",
      });
    }

    // 2️⃣ Query filtered by bhawan + open trips only
    const query = `
      SELECT
        id,
        runner_name,
        shop_name,
        departure_time,
        status,
        created_at,
        bhawan,
        creator_id
      FROM trips
      WHERE status = 'open'
        AND bhawan = $1
      ORDER BY departure_time ASC
    `;

    const result = await pool.query(query, [bhawan]);

    // 3️⃣ Always return an array
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Failed to fetch trips:", err.message);

    res.status(500).json({
      error: "Failed to fetch trips",
    });
  }
});


app.post("/trips", authMiddleware, async (req, res) => {
  try {
    const { runner_name, shop_name, departure_time,bhawan } = req.body;
    const creatorId = req.user.id;

    // 1️⃣ Basic validation (trust nothing from client)
    if (!runner_name || !shop_name || !departure_time || !bhawan) {
      return res.status(400).json({
        error: "runner_name, shop_name, and departure_time are required",
      });
    }

    // 2️⃣ Insert query (parameterized → SQL injection safe)
    const query = `
      INSERT INTO trips (runner_name, shop_name, departure_time,bhawan,status,creator_id)
      VALUES ($1, $2, $3,$4, 'open',$5)
      RETURNING
        id,
        runner_name,
        shop_name,
        departure_time,
        status,
        created_at,
        bhawan
    `;

    const values = [runner_name, shop_name, departure_time,bhawan,creatorId];

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

app.patch("/trips/:id/close", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validate path param
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid trip id",
      });
    }

    // 2️⃣ Close only if currently open
    const query = `
    UPDATE trips
    SET status = 'closed'
    WHERE id = $1
      AND status = 'open'
      AND creator_id = $2
    RETURNING
      id,
      runner_name,
      shop_name,
      departure_time,
      status,
      created_at
    `;

    const result = await pool.query(query, [id,req.user.id]);

    // 3️⃣ No rows updated → either not found or already closed
    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "You are not allowed to close this trip",
      });
    }


    // 4️⃣ Return updated trip
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to close trip:", err.message);

    res.status(500).json({
      error: "Failed to close trip",
    });
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1️⃣ Basic validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        error: "name, email, password, and phone are required",
      });
    }

    // 2️⃣ Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3️⃣ Insert user
    const query = `
      INSERT INTO users (name, email, password_hash, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone
    `;

    const values = [name, email, passwordHash, phone];

    const result = await pool.query(query, values);

    // 4️⃣ Return created user (no password)
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Unique email violation
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    console.error("Registration failed:", err.message);

    res.status(500).json({
      error: "Registration failed",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    // 2️⃣ Fetch user by email
    const query = `
      SELECT id, name, email, password_hash, phone
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query(query, [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // 3️⃣ Compare password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // 4️⃣ Issue JWT
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 5️⃣ Return token + user (no password)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login failed:", err.message);

    res.status(500).json({
      error: "Login failed",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
