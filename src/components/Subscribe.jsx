import React, { useState } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";

function getUserEmail() {
  const token = localStorage.getItem("access_token");  
  if (!token) return null;
  
  try {
      const decoded = jwtDecode(token);
      return decoded.sub;  
  } catch (error) {
      console.error("Invalid token:", error);
      return null;
  }
}

function SubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
      const email = getUserEmail();
      if (!email) {
          setError("User not logged in!");
          return;
      }

      setLoading(true);
      setError("");

      try {
          const response = await axios.post("https://www.luga.app/api/stripe/subs", {
              email,
              price_id: "price_12345"
          });

          window.location.href = response.data.url; // Redirect to Stripe Checkout
      } catch (err) {
          setError("Failed to start subscription. Please try again.");
      }

      setLoading(false);
  };

  return (
      <button onClick={handleSubscribe} disabled={loading} className="w-full py-3 border rounded-lg">
          {loading ? "Processing..." : "Get Started"}
      </button>
  );
}

export default SubscriptionButton;