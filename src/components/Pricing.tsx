import React, { useState, useEffect } from 'react';
import PricingToggle from './pricing/PricingToggle';
import PricingCard, { PricingPlan } from './pricing/PricingCard';
import PricingHeader from './pricing/PricingHeader';
import axios from "../api/axios";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";
import { useAuth } from "./auth";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISH_KEY as string); // Cast to string



const Pricing = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [processingPlanName, setProcessingPlanName] = useState<string | undefined>(undefined); // Changed to undefined
    const [plans, setPlans] = useState<PricingPlan[]>([]); // Added type
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | undefined>(undefined); // Changed to undefined
    const { getUserEmail } = useAuth();

    const fetchPlans = async () => {
      const response = await axios.get("/stripe/subscription_plans");
      setPlans(response.data);
    };

    const getSubscriptionStatus = async () => {
      try {
        const response = await axios.post("/stripe/subscription_status", {
          email: getUserEmail(),
        });
        setSubscriptionStatus(response.data.subscription_plan);
      } catch (err) {
        console.error("Error getting subscription status:", err);
      }
    };

    useEffect(() => {
      fetchPlans();
      getSubscriptionStatus();
    }, []);

    const handleSubscribe = async (priceName: string, priceId: string) => {
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
          const { error } = await stripe.redirectToCheckout({ sessionId });
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
      } finally {
        setLoading(false);
        setProcessingPlanName(undefined); // Set to undefined
      }
    };

    return (
      <div className="py-16 mx-auto px-4 sm:px-6 lg:px-8">
        <PricingHeader 
          title="Luga Pricing" 
          subtitle="Choose the perfect plan for your video creation needs" 
        />
        
        {/* <PricingToggle 
          billingCycle={billingCycle} 
          onChange={setBillingCycle} 
        /> */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {plans.sort((a, b) => a.created - b.created).map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              subscriptionStatus={subscriptionStatus}
              processingPlanName={processingPlanName}
              loading={loading}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      </div>
    );
};

export default Pricing;
