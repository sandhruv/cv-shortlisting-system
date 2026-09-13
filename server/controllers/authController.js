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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  // Keep account existence private until an email delivery provider is configured.
  res.status(200).json({
    message: "Your reset request was received. Please contact the administrator for the password reset link.",
  });
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Email, old password, and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({ message: "Email or old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ message: "Password changed successfully. You can now sign in." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.registerFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: "Invalid face descriptor data" });
    }

    const euclideanDistance = (a, b) => {
      if (a.length !== b.length) return Infinity;
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
      }
      return Math.sqrt(sum);
    };

    const THRESHOLD = 0.6;
    const otherUsers = await User.find({
      faceRegistered: true,
      _id: { $ne: user._id },
    }).select("+faceDescriptor");

    for (const other of otherUsers) {
      if (!other.faceDescriptor || other.faceDescriptor.length !== 128) continue;
      const distance = euclideanDistance(faceDescriptor, other.faceDescriptor);
      if (distance < THRESHOLD) {
        return res.status(409).json({
          message: "This face is already registered to another account. Please use your own face.",
        });
      }
    }

    user.faceDescriptor = faceDescriptor;
    user.faceRegistered = true;
    await user.save();

    res.status(200).json({ message: "Face registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.faceLogin = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: "Invalid face descriptor data" });
    }

    const users = await User.find({ faceRegistered: true }).select("+faceDescriptor");

    if (!users.length) {
      return res.status(404).json({ message: "No registered faces found. Please register your face first." });
    }

    const euclideanDistance = (a, b) => {
      if (a.length !== b.length) return Infinity;
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
      }
      return Math.sqrt(sum);
    };

    const THRESHOLD = 0.6;
    const matchedUsers = [];

    for (const user of users) {
      if (!user.faceDescriptor || user.faceDescriptor.length !== 128) continue;
      const distance = euclideanDistance(faceDescriptor, user.faceDescriptor);
      if (distance < THRESHOLD) {
        matchedUsers.push({ user, distance });
      }
    }

    if (matchedUsers.length === 0) {
      return res.status(401).json({ message: "Face not recognized. Please try again or use password." });
    }

    if (matchedUsers.length > 1) {
      return res.status(401).json({ message: "This face is linked to multiple accounts. Please use password to login." });
    }

    const matchedUser = matchedUsers[0].user;

    if (matchedUser.role === "HR") {
      const now = new Date();
      const trialEndsAt = matchedUser.trialEndsAt ? new Date(matchedUser.trialEndsAt) : null;
      const planEndsAt = matchedUser.planEndsAt ? new Date(matchedUser.planEndsAt) : null;

      if (!matchedUser.subscriptionPlan || matchedUser.subscriptionPlan === "trial") {
        if (!trialEndsAt || now > trialEndsAt) {
          return res.status(403).json({
            message: "Your 3-day trial has ended. Please contact the main admin to activate a monthly or yearly plan.",
          });
        }
      } else if (["monthly", "yearly"].includes(matchedUser.subscriptionPlan)) {
        if (!planEndsAt || now > planEndsAt) {
          return res.status(403).json({
            message: "Your HR plan has expired. Please contact the main admin to renew it.",
          });
        }
      } else if (matchedUser.subscriptionPlan === "inactive") {
        return res.status(403).json({
          message: "Your HR account is inactive. Please contact the main admin to activate a plan.",
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
    }

    const token = jwt.sign(
      { id: matchedUser._id, role: matchedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Face login successful",
      token,
      user: {
        id: matchedUser._id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        subscriptionPlan: matchedUser.subscriptionPlan,
        trialEndsAt: matchedUser.trialEndsAt,
        planEndsAt: matchedUser.planEndsAt,
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
