const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const allowedRole = role === "HR" ? "HR" : "Student";
    if (role && !["Student", "HR"].includes(role)) {
      return res.status(403).json({ message: "Registration may only create Student or HR accounts" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userPayload = {
      name,
      email,
      password: hashedPassword,
      role: allowedRole,
    };

    if (allowedRole === "HR") {
      userPayload.subscriptionPlan = "trial";
      userPayload.trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    } else {
      userPayload.subscriptionPlan = "inactive";
    }

    const user = await User.create(userPayload);

    res.status(201).json({
      message: "Registration Successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        trialEndsAt: user.trialEndsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.role === "HR") {
      const now = new Date();
      const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
      const planEndsAt = user.planEndsAt ? new Date(user.planEndsAt) : null;

      if (!user.subscriptionPlan || user.subscriptionPlan === "trial") {
        if (!trialEndsAt || now > trialEndsAt) {
          return res.status(403).json({
            message: "Your 3-day trial has ended. Please contact the main admin to activate a monthly or yearly plan.",
          });
        }
      } else if (["monthly", "yearly"].includes(user.subscriptionPlan)) {
        if (!planEndsAt || now > planEndsAt) {
          return res.status(403).json({
            message: "Your HR plan has expired. Please contact the main admin to renew it.",
          });
        }
      } else if (user.subscriptionPlan === "inactive") {
        return res.status(403).json({
          message: "Your HR account is inactive. Please contact the main admin to activate a plan.",
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        trialEndsAt: user.trialEndsAt,
        planEndsAt: user.planEndsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.lpuLogin = async (req, res) => {
  try {
    const { uid, password } = req.body;
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(400).json({ message: "Invalid UID or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid UID or password" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "LPU Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        uid: user.uid,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
