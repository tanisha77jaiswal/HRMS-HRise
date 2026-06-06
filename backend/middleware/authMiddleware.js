import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hrise_super_secure_jwt_token_secret_key_2026";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access denied. Invalid or expired token." });
    }
    req.user = user;
    next();
  });
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Unauthorized role." });
    }
    next();
  };
}
