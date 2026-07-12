exports.isHRorAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "HR" || req.user.role === "Admin")) {
    next();
  } else {
    console.warn("⚠️ Access denied for role:", req.user?.role);
    res.status(403).json({ message: "Access denied. HR or Admin only." });
  }
};
