import { useState } from "react";

function RazorpayCheckout({ user, plan, amount, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!window.Razorpay) {
      alert("Razorpay SDK is not loaded. Add your Razorpay checkout script in the browser.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ plan, amount }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to create order");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Vettora HR Subscription",
        description: `${plan === "yearly" ? "Yearly" : "Monthly"} HR plan`,
        order_id: data.order.id,
        handler: async function (paymentResponse) {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              plan,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(verifyData.message || "Payment verification failed");
          onSuccess?.(verifyData.user);
        },
        theme: { color: "#d4af37" },
        modal: {
          ondismiss: () => {
            onCancel?.();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      alert(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full px-4 py-2 rounded-lg bg-[#d4af37] text-[#0d131f] font-semibold disabled:opacity-60"
    >
      {loading ? "Processing..." : `Pay ${amount} via Razorpay`}
    </button>
  );
}

export default RazorpayCheckout;
