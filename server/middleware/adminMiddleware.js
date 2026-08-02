exports.isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "Admin" || req.user.role === "LPU Admin")) {
    next();
  } else {
    console.warn("⚠️ Access denied for role:", req.user?.role);
    res.status(403).json({ message: "Access denied. Admin or LPU Admin only." });
  }
};

exports.isMainOrLpuAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "Admin" || req.user.role === "LPU Admin")) {
    next();
  } else {
    console.warn("⚠️ Access denied for role:", req.user?.role);
    res.status(403).json({ message: "Access denied. Admin or LPU Admin only." });
  }
};
