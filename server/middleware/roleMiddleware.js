exports.isHRorAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "HR" || req.user.role === "Admin" || req.user.role === "LPU Faculty" || req.user.role === "LPU Admin")) {
    next();
  } else {
    console.warn("⚠️ Access denied for role:", req.user?.role);
    res.status(403).json({ message: "Access denied. HR/Faculty or Admin only." });
  }
};
