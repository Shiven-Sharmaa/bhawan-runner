const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1️⃣ Check header exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing",
    });
  }

  // 2️⃣ Expect format: Bearer <token>
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Invalid authorization format",
    });
  }

  const token = parts[1];

  try {
    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Attach user info to request
    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
