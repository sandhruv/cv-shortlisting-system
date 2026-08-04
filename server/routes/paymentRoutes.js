const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const hasRazorpayConfig = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const razorpay = hasRazorpayConfig
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

router.post("/create-order", protect, async (req, res) => {
  try {
    const { plan, amount } = req.body;
    const validPlans = ["monthly", "yearly"];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Invalid payment plan" });
    }

    if (!hasRazorpayConfig || !razorpay) {
      return res.status(500).json({ message: "Razorpay credentials not configured" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ message: "Missing payment verification details" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "HR") {
      return res.status(403).json({ message: "Only HR users can activate a paid plan" });
    }

    const now = new Date();
    const planEndsAt = plan === "yearly"
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    user.subscriptionPlan = plan;
    user.trialEndsAt = null;
    user.planEndsAt = planEndsAt;
    await user.save();

    res.status(200).json({
      message: "Payment verified and plan activated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        planEndsAt: user.planEndsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
