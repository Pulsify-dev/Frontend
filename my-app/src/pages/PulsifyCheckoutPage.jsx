import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PulsifyAuthVaultContext } from "../store/PulsifyAuthVault";
import { PulsifyPremiumService } from "../services/pulsifyPremiumService";
import "../components/premium/css/PulsifyCheckout.css";

export const PulsifyCheckoutPage = () => {
  const navigate = useNavigate();
  const { setSubscriptionTierOverride, refreshSubscription } =
    useContext(PulsifyAuthVaultContext) || {};

  const [billingCycle, setBillingCycle] = useState("monthly");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(null); // null | 'checkout' | 'webhook' | 'done'
  const [error, setError] = useState(null);

  // Mock form state (no real validation needed)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    country: "Egypt",
    postcode: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const monthlyPrice = "$12.00";
  const yearlyPrice = "$99.00";
  const yearlyMonthly = "$8.25";
  const selectedPrice = billingCycle === "yearly" ? yearlyPrice : monthlyPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setProcessing(true);

      // Step 1: Create Checkout
      setStep("checkout");
      const checkoutData = await PulsifyPremiumService.createCheckout();

      // Step 2: Fire Webhook (simulate Stripe callback)
      setStep("webhook");
      const webhookPayload = checkoutData.webhook_payload_example;
      await PulsifyPremiumService.fireWebhook(webhookPayload);

      // Step 3: Update local state
      setStep("done");
      if (setSubscriptionTierOverride) {
        setSubscriptionTierOverride("PRO");
      }
      if (refreshSubscription) {
        await refreshSubscription();
      }

      // Redirect back to premium page with success
      setTimeout(() => {
        navigate("/premium", { state: { upgraded: true } });
      }, 1200);
    } catch (err) {
      setError("Payment processing failed. Please try again.");
      setStep(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pulsify-checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <div className="checkout-header-logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#f50">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
          <span className="checkout-header-title">Pulsify</span>
        </div>
        <button
          className="checkout-back-btn"
          onClick={() => navigate("/premium")}
        >
          ← Back to plans
        </button>
      </div>

      <form className="checkout-content" onSubmit={handleSubmit}>
        {/* Left Column */}
        <div className="checkout-left">
          {/* Section 1: Billing Cycle */}
          <section className="checkout-section">
            <h2 className="checkout-section-title">
              <span className="checkout-step-number">1</span>
              Billing cycle
            </h2>

            <label
              className={`checkout-radio-card ${billingCycle === "yearly" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="billing"
                value="yearly"
                checked={billingCycle === "yearly"}
                onChange={() => setBillingCycle("yearly")}
              />
              <div className="radio-card-content">
                <div className="radio-card-main">
                  <strong>Yearly billing</strong>
                  <span className="radio-card-price">
                    {yearlyPrice}/yr, that's {yearlyMonthly}/month
                  </span>
                </div>
                <span className="checkout-discount-badge">SAVE 30%</span>
              </div>
            </label>

            <label
              className={`checkout-radio-card ${billingCycle === "monthly" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="billing"
                value="monthly"
                checked={billingCycle === "monthly"}
                onChange={() => setBillingCycle("monthly")}
              />
              <div className="radio-card-content">
                <div className="radio-card-main">
                  <strong>Monthly billing</strong>
                  <span className="radio-card-price">
                    {monthlyPrice}/month
                  </span>
                </div>
              </div>
            </label>
          </section>

          {/* Section 2: Payment Details */}
          <section className="checkout-section">
            <h2 className="checkout-section-title">
              <span className="checkout-step-number">2</span>
              Payment details
              <svg
                className="checkout-lock-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="#888"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="#888" strokeWidth="2" />
              </svg>
            </h2>

            <div className="checkout-payment-method">
              <label className="checkout-radio-card selected">
                <input type="radio" name="method" checked readOnly />
                <div className="radio-card-content">
                  <strong>Card</strong>
                  <div className="card-brand-icons">
                    <span className="card-brand visa">VISA</span>
                    <span className="card-brand mastercard">MC</span>
                    <span className="card-brand amex">AMEX</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="checkout-form-grid">
              <div className="checkout-field">
                <input
                  type="text"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                />
              </div>
              <div className="checkout-field">
                <input
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                />
              </div>
              <div className="checkout-field full-width">
                <input
                  type="text"
                  placeholder="Card number"
                  value={form.cardNumber}
                  onChange={handleChange("cardNumber")}
                  maxLength={19}
                />
                <svg
                  className="field-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="#666"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" stroke="#333" strokeWidth="1" />
                </svg>
              </div>
              <div className="checkout-field-row">
                <input
                  type="text"
                  placeholder="MM"
                  value={form.expiryMonth}
                  onChange={handleChange("expiryMonth")}
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="YY"
                  value={form.expiryYear}
                  onChange={handleChange("expiryYear")}
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={form.cvv}
                  onChange={handleChange("cvv")}
                  maxLength={4}
                />
              </div>
              <div className="checkout-field full-width">
                <label className="checkout-field-label">Billing Country</label>
                <select
                  value={form.country}
                  onChange={handleChange("country")}
                >
                  <option>Egypt</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>Canada</option>
                  <option>Saudi Arabia</option>
                  <option>UAE</option>
                </select>
              </div>
              <div className="checkout-field full-width">
                <input
                  type="text"
                  placeholder="Postcode (optional)"
                  value={form.postcode}
                  onChange={handleChange("postcode")}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column — Order Summary */}
        <div className="checkout-right">
          <section className="checkout-section checkout-summary">
            <h2 className="checkout-section-title">
              <span className="checkout-step-number">3</span>
              Review your purchase
            </h2>

            <div className="checkout-plan-card">
              <div className="plan-card-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="#f50">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <span className="plan-card-name">Artist Pro</span>
            </div>

            <div className="checkout-summary-rows">
              <div className="summary-row summary-total">
                <span>Total</span>
                <span className="summary-price">{selectedPrice}</span>
              </div>
              <div className="summary-row">
                <span>Billing cycle</span>
                <span>{billingCycle === "yearly" ? "Yearly" : "Monthly"}</span>
              </div>
            </div>

            <p className="checkout-renewal-note">
              Subscription will automatically renew at {selectedPrice} every{" "}
              {billingCycle === "yearly" ? "year" : "month"}, unless you cancel
              before the day of your next renewal in your subscription settings.
            </p>

            {/* Processing Steps */}
            {step && (
              <div className="checkout-processing">
                <div className={`processing-step ${step === "checkout" ? "active" : step === "webhook" || step === "done" ? "done" : ""}`}>
                  <div className="processing-dot" />
                  <span>Creating checkout session...</span>
                </div>
                <div className={`processing-step ${step === "webhook" ? "active" : step === "done" ? "done" : ""}`}>
                  <div className="processing-dot" />
                  <span>Processing payment...</span>
                </div>
                <div className={`processing-step ${step === "done" ? "active done" : ""}`}>
                  <div className="processing-dot" />
                  <span>Activating Artist Pro ★</span>
                </div>
              </div>
            )}

            {error && <div className="checkout-error">{error}</div>}

            <button
              type="submit"
              className="checkout-buy-btn"
              disabled={processing}
            >
              {processing
                ? step === "done"
                  ? "✓ Redirecting..."
                  : "Processing..."
                : "Buy subscription"}
            </button>

            <p className="checkout-legal">
              By submitting your payment information and clicking Buy
              subscription you agree to the{" "}
              <a href="#terms">Terms of Use for Artist Subscriptions</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </p>

            {/* Stripe Badge */}
            <div className="checkout-stripe-badge">
              <svg viewBox="0 0 60 25" width="60" height="25" className="stripe-logo">
                <path
                  d="M5 10.2c0-.7.6-1 1.5-1 1.4 0 3.1.4 4.5 1.2V6.3C9.5 5.7 8 5.4 6.5 5.4 2.6 5.4 0 7.4 0 10.5c0 4.8 6.6 4 6.6 6.1 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.4v4.2c1.7.7 3.3 1 4.9 1 4 0 6.8-2 6.8-5.1C11.7 11.9 5 12.8 5 10.2zM16.2 2.5l-4.7 1V7l4.7-1V2.5zM11.5 8.2h4.7v14h-4.7v-14zM24.2 8.2l-.3-1h-4.2v17.5l4.7-1V19c.8.6 2 1 3.1 1 3.2 0 6.1-2.6 6.1-8.2 0-5.2-2.9-7.8-6-7.8-1.2 0-2.4.4-3.4 1.2zm-.1 9.8V12c.8-.9 2-1.2 2.8-1.2 2.1 0 2.7 2 2.7 4.2 0 2.5-.7 4.3-2.7 4.3-.8 0-1.9-.4-2.8-1.3zM44.4 11.8c0-2.3-1.1-4.2-4-4.2-1.2 0-2.5.3-3.6 1L36.1 9c.8-.4 2-.7 2.8-.7 1.3 0 1.5.7 1.5 1.2-.1 0-1.3-.1-2.3 0-2.8.3-4.7 1.4-4.7 3.9 0 2.3 1.6 3.5 3.7 3.5 1.2 0 2.3-.5 3.3-1.3l.1.8h4.2v-.3c-.2-.5-.3-1.5-.3-2.5v-1.8zm-4.1 2.3c-.7.6-1.5.8-2 .8-.9 0-1.3-.4-1.3-1.1 0-1 1-1.4 2.5-1.4.4 0 .6 0 .8.1v1.6zM52 7.6c-1.3 0-2.2.6-2.7 1.1l-.2-.9h-4.2v18.7l4.7-1V20c.6.4 1.5.7 2.5.7 3.2 0 5.9-2.5 5.9-8.1 0-5-2.7-5-6-5zM51 16.8c-.9 0-1.4-.3-1.8-.7V12c.4-.5 1-.8 1.8-.8 1.4 0 2.3 1.5 2.3 2.9 0 1.6-.9 2.7-2.3 2.7z"
                  fill="#6772E5"
                />
              </svg>
              <span>Powered by Stripe</span>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
};
