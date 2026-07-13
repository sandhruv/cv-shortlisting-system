const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};
