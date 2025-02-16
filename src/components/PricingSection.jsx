import { useState, useEffect } from "react";
import axios from "../api/axios";
import { jwtDecode } from "jwt-decode";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISH_KEY);

const PricingSection = () => {
  const [loading, setLoading] = useState(false);
  const [processingPlanName, setProcessingPlanName] = useState(null);
  const [plans, setPlans] = useState([]);

  const fetchPlans = async () => {
    const response = await axios.get("/stripe/subscription_plans");
    setPlans(response.data);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const getUserEmail = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("You must be logged in to subscribe.");
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      return decoded.sub;
    } catch (err) {
      console.error("Invalid token:", err);
      return null;
    }
  };

  const handleSubscribe = async (priceName, priceId) => {
    const email = getUserEmail();
    if (!email) {
      toast.error("You must be logged in to subscribe.");
      return;
    }
    setLoading(true);
    setProcessingPlanName(priceName);
    try {
      const purchase = { email, name: priceName, priceId };
      const response = await axios.post("/stripe/subs", purchase);
      if (response.status === 200) {
        const data = response.data;
        const sessionId = data.session_id; // Get session_id from response
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe failed to initialize.");
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({ sessionId });
        toast.error("Error redirecting to checkout: " + error.message);
        if (error) {
          throw new Error("Error redirecting to checkout: " + error.message);
        }
      } else {
        const errorData = response.data;
        toast.error(
          "Error creating subscription session: " + errorData.detail ||
            "Unknown error"
        );
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to start subscription. Please try again.");
    }

    setLoading(false);
    setProcessingPlanName(null);
  };

  return (
    <div className="py-32 bg-gradient-to-b from-purple-50 via-purple-50/50 to-transparent">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-medium mb-4">
            A simple pricing system.
          </h2>
          <h3 className="text-4xl font-medium mb-8">
            Select what works for you
          </h3>
          <p className="text-gray-600">
            Free 30-day trial, no credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mx-auto">
          {plans
            .sort((a, b) => a.created - b.created)
            .map((plan, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg flex flex-col justify-between"
              >
                <div className="flex flex-col justify-between">
                  <h3 className="text-2xl font-medium mb-2 text-left">
                    {plan.name}
                  </h3>
                  <div className="mb-8 text-left">
                    {plan.marketing_features.map((feature, index) => (
                      <p key={index} className="text-gray-600 mb-2 text-left">
                        {feature.name}
                      </p>
                    ))}
                    <span className="text-5xl font-medium">
                      ${plan.prices[0].unit_amount / 100}
                    </span>
                  </div>
                </div>
                <button
                  className="w-full right-0 py-3 text-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={() => handleSubscribe(plan.name, plan.prices[0].id)}
                  disabled={loading && processingPlanName === plan.name}
                >
                  {loading && processingPlanName === plan.name
                    ? "Processing..."
                    : "Get started"}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
