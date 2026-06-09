import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import ScrollAnimation from "./ScrollAnimation";
import { load } from "@cashfreepayments/cashfree-js";

export default function RegistrationForm({ selectedPlan, setSelectedPlan }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    college: "",
    goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Pay, 3: Success
  const [error, setError] = useState("");
  const [recentBuyer, setRecentBuyer] = useState(null);

  const amount = selectedPlan === "workshop" ? 59 : 159;

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    // Determine the base URL for the API/socket connection
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    // If you are proxying through package.json, socket URL is the proxy or current host
    const socketUrl = isLocalhost
      ? "http://localhost:5000"
      : window.location.origin;

    const socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("payment_received", (data) => {
      // Social proof toast when someone buys
      setRecentBuyer(data);
      setTimeout(() => setRecentBuyer(null), 5000);
    });

    return () => socket.disconnect();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    const { name, phone, email, college } = form;
    if (!name || !phone || !email || !college) {
      setError("Please fill in all required fields.");
      return;
    }
    setStep(2);
  };

  const handlePayment = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Create order on backend
      const orderRes = await axios.post("/api/create-order", {
        plan: selectedPlan,
        formData: form
      });
      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || "Failed to create order");
      }

      const { orderId, paymentSessionId } = orderRes.data;

      // Developer Bypass: Skip Cashfree modal if name is DEV_TEST
      if (form.name === "DEV_TEST") {
        try {
          const verifyRes = await axios.post("/api/verify-payment", {
            orderId: orderId,
            formData: { ...form, plan: selectedPlan },
            devBypass: true
          });
          if (verifyRes.data.success) {
            setStep(3);
          } else {
            setError(verifyRes.data.message || "Payment verification failed");
            setStep(1);
          }
        } catch (err) {
          setError(err.response?.data?.message || "Error verifying DEV_TEST payment.");
          setStep(1);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2. Initialize Cashfree SDK
      const cashfree = await load({ mode: "production" });

      // 3. Open Cashfree Checkout Modal
      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal"
      }).then(async (result) => {
        if (result.error) {
           setError(result.error.message || "Payment failed or cancelled.");
           setStep(1);
           setLoading(false);
        }
        if (result.paymentDetails) {
           // Payment is successful, verify on backend
           try {
             setLoading(true);
             const verifyRes = await axios.post("/api/verify-payment", {
               orderId: orderId,
               formData: { ...form, plan: selectedPlan },
             });

             if (verifyRes.data.success) {
               setStep(3); // Move to Success step
             } else {
               setError(verifyRes.data.message || "Payment verification failed");
               setStep(1);
             }
           } catch (err) {
             setError(
               err.response?.data?.message ||
                 "Error verifying payment. If amount was deducted, please contact support."
             );
             setStep(1);
           } finally {
             setLoading(false);
           }
        }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  const s = {
    section: {
      padding: "80px 0",
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border)",
      position: "relative",
    },
    heading: {
      fontSize: "clamp(24px, 4vw, 36px)",
      fontWeight: 800,
      marginBottom: 8,
      textAlign: "center",
    },
    sub: {
      color: "var(--text-secondary)",
      fontSize: 15,
      marginBottom: 48,
      textAlign: "center",
      maxWidth: 540,
      margin: "0 auto 48px",
    },
    layout: {
      display: "flex",
      justifyContent: "center",
    },
    card: {
      width: "100%",
      maxWidth: 640,
      padding: "40px 32px",
      borderRadius: "var(--radius-lg)",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20,
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    fieldFull: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      gridColumn: "1 / -1",
    },
    label: {
      fontSize: 13,
      color: "var(--text-secondary)",
      fontWeight: 600,
      letterSpacing: "0.2px",
    },
    planToggle: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginBottom: 32,
    },
    planOpt: {
      padding: "16px",
      border: "2px solid var(--border)",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      transition: "all 0.2s",
      background: "var(--bg-primary)",
      textAlign: "center",
    },
    planOptActive: {
      borderColor: "var(--primary)",
      background: "var(--primary-light)",
      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)",
    },
    planOptTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-primary)",
      marginBottom: 4,
    },
    planOptPrice: {
      fontSize: 14,
      fontWeight: 800,
      color: "var(--primary)",
    },
    submitBtn: {
      width: "100%",
      marginTop: 24,
      padding: "16px",
      background:
        "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
      color: "#ffffff",
      borderRadius: "var(--radius-md)",
      fontSize: 16,
      fontWeight: 700,
      boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
      border: "none",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    submitBtnDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
      transform: "none !important",
      boxShadow: "none !important",
    },
    successBox: {
      textAlign: "center",
      padding: "48px 32px",
    },
    successIcon: {
      fontSize: 64,
      marginBottom: 24,
      animation: "pulse 2s infinite",
    },
    successTitle: {
      fontWeight: 800,
      fontSize: 28,
      marginBottom: 16,
      color: "var(--accent)",
    },
    successSub: {
      fontSize: 16,
      color: "var(--text-secondary)",
      lineHeight: 1.7,
    },
    errorMsg: {
      fontSize: 14,
      color: "#ef4444",
      marginTop: 16,
      fontWeight: 600,
      textAlign: "center",
      background: "rgba(239, 68, 68, 0.1)",
      padding: "12px",
      borderRadius: "var(--radius-sm)",
    },
    toast: {
      position: "fixed",
      bottom: 32,
      right: 32,
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderLeft: "4px solid var(--primary)",
      boxShadow: "0 10px 40px rgba(99, 102, 241, 0.25)",
      padding: "20px 24px",
      borderRadius: "var(--radius-md)",
      display: "flex",
      alignItems: "center",
      gap: 16,
      zIndex: 1000,
      animation:
        "toastEnter 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
    },
  };

  return (
    <section id="register" style={s.section}>
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-5%",
          width: "400px",
          height: "400px",
          background: "var(--primary)",
          borderRadius: "50%",
          filter: "blur(120px)",
          zIndex: 0,
          opacity: 0.15,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-5%",
          width: "300px",
          height: "300px",
          background: "var(--accent)",
          borderRadius: "50%",
          filter: "blur(120px)",
          zIndex: 0,
          opacity: 0.15,
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <h2 style={s.heading}>
          Register Now{" "}
          <ScrollAnimation animationClass="unlock-bounce">🔓</ScrollAnimation>
        </h2>
        <p style={s.sub}>Complete your registration in just a few clicks.</p>

        <div style={s.layout}>
          <div style={s.card} className="glass fade-up shadow-lg">
            {/* Stepper Header */}
            <div className="stepper-container">
              <div
                className={`step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}
              >
                <div className="step-circle">{step > 1 ? "✓" : "1"}</div>
                <div className="step-label">Details</div>
              </div>
              <div
                className={`step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}
              >
                <div className="step-circle">{step > 2 ? "✓" : "2"}</div>
                <div className="step-label">Payment</div>
              </div>
              <div className={`step ${step === 3 ? "active" : ""}`}>
                <div className="step-circle">3</div>
                <div className="step-label">Confirmation</div>
              </div>
            </div>

            {/* Step 1: Details */}
            {step === 1 && (
              <div className="fade-up">
                <div style={s.planToggle}>
                  {[
                    { key: "workshop", label: "Group Workshop", price: "₹59" },
                    { key: "oneonone", label: "1-on-1 Call", price: "₹159" },
                  ].map((p) => (
                    <div
                      key={p.key}
                      style={{
                        ...s.planOpt,
                        ...(selectedPlan === p.key ? s.planOptActive : {}),
                      }}
                      onClick={() => setSelectedPlan(p.key)}
                      className="glow-hover"
                    >
                      <div style={s.planOptTitle}>{p.label}</div>
                      <div style={s.planOptPrice}>{p.price}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleNextStep} style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>WhatsApp Number *</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                  <div style={s.fieldFull}>
                    <label style={s.label}>Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>
                  <div style={s.fieldFull}>
                    <label style={s.label}>College & Year *</label>
                    <input
                      name="college"
                      value={form.college}
                      onChange={handleChange}
                      placeholder="e.g. IIT Delhi, 3rd Year"
                      required
                    />
                  </div>
                  <div style={s.fieldFull}>
                    <label style={s.label}>
                      What do you want to learn? (optional)
                    </label>
                    <textarea
                      name="goal"
                      value={form.goal}
                      onChange={handleChange}
                      placeholder="e.g. Resume tips, interview process, etc."
                    />
                  </div>

                  {error && (
                    <div style={{ ...s.fieldFull, ...s.errorMsg }}>
                      ⚠ {error}
                    </div>
                  )}

                  <div style={s.fieldFull}>
                    <button
                      type="submit"
                      style={s.submitBtn}
                      className="glow-hover"
                    >
                      Proceed to Pay (₹{amount}) →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Pay */}
            {step === 2 && (
              <div
                className="fade-up"
                style={{ textAlign: "center", padding: "20px 0" }}
              >
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
                  Ready to Complete?
                </h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
                  You are registering for the{" "}
                  <strong>
                    {selectedPlan === "workshop"
                      ? "Group Workshop"
                      : "1-on-1 Call"}
                  </strong>
                  .
                </p>

                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "24px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    marginBottom: 32,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Name</span>
                    <span style={{ fontWeight: 600 }}>{form.name}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Email</span>
                    <span style={{ fontWeight: 600 }}>{form.email}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border)",
                      paddingTop: 12,
                      marginTop: 12,
                    }}
                  >
                    <span
                      style={{ color: "var(--text-primary)", fontWeight: 700 }}
                    >
                      Total Amount
                    </span>
                    <span
                      style={{
                        color: "var(--primary)",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      ₹{amount}
                    </span>
                  </div>
                </div>

                {/* Payment Checkout Options */}
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.05)",
                    border: "1px solid var(--primary)",
                    padding: "24px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: 32,
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      marginBottom: 16,
                      lineHeight: 1.6,
                    }}
                  >
                    Click below to pay securely via Cashfree Payments. You can use UPI, Credit/Debit Cards, Netbanking, or Wallets.
                  </p>
                  <button
                    onClick={handlePayment}
                    style={{ ...s.submitBtn, marginTop: 0 }}
                    disabled={loading}
                    className="glow-hover"
                  >
                    {loading ? "Processing..." : `Pay ₹${amount} Securely`}
                  </button>
                </div>

                {error && <div style={s.errorMsg}>⚠ {error}</div>}

                <div style={{ display: "flex", gap: 16 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      ...s.submitBtn,
                      background: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      boxShadow: "none",
                    }}
                    disabled={loading}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div style={s.successBox} className="fade-up">
                <div style={s.successIcon}>🎉</div>
                <div style={s.successTitle}>Registration Confirmed!</div>
                <p style={s.successSub}>
                  Thank you, <strong>{form.name}</strong>. Your payment was
                  successful. You now have full access to the{" "}
                  {selectedPlan === "workshop"
                    ? "Group Workshop"
                    : "1-on-1 Call"}
                  .
                  <br />
                  <br />
                  <strong>Next Step:</strong> Create a login account using{" "}
                  <strong>{form.email}</strong> to access the session recording
                  and materials.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    ...s.submitBtn,
                    maxWidth: 300,
                    margin: "32px auto 0",
                  }}
                  className="glow-hover"
                >
                  Create Login Account →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Proof Toast */}
      {recentBuyer && (
        <div style={s.toast}>
          <div style={{ fontSize: 32, animation: "pulse 2s infinite" }}>🔥</div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "var(--primary)",
                marginBottom: 2,
              }}
            >
              Just joined!
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <strong>{recentBuyer.name || "Someone"}</strong> registered for
              the{" "}
              <strong>
                {recentBuyer.plan === "workshop" ? "Workshop" : "1-on-1 Call"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
