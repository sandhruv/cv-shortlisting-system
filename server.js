// Add this BEFORE your app.listen() line
app.get("/", (req, res) => {
  res.json({
    message: "CV Shortlisting System API is running 🚀",
    available_endpoints: {
      auth: "/api/auth/login, /api/auth/register",
      admin: "/api/admin",
      profile: "/api/profile (requires auth token)",
    },
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});