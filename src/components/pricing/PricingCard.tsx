import { Check } from 'lucide-react';
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export interface PricingFeature {
  name: string;
}

export interface PlanPrice {
  unit_amount: number;
  id: string;
}

export interface PricingPlan {
  name: string;
  description?: string;
  marketing_features: PricingFeature[];
  prices: PlanPrice[];
  popular?: boolean;
  created: number;
}

interface PricingCardProps {
  plan: PricingPlan;
  subscriptionStatus?: string;
  processingPlanName?: string;
  loading?: boolean;
  onSubscribe: (planName: string, priceId: string) => void;
}

const PricingCard = ({
  plan,
  subscriptionStatus,
  processingPlanName,
  loading = false,
  onSubscribe,
}: PricingCardProps) => {
  const isSubscribed = subscriptionStatus === plan.name;
  const isProcessing = loading && processingPlanName === plan.name;
  const isPopular = plan.popular;

  return (
    <div className={cn(
      "bg-white w-full rounded-3xl p-8 shadow-lg flex flex-col justify-between h-full relative overflow-hidden",
      isPopular && "ring-2 ring-primary-500"
    )}>
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-primary-500 text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      <div className="flex flex-col">
        <h3 className="text-2xl font-medium mb-2 text-left mt-4">
          {plan.name}
        </h3>
       
        <div className="mb-8">
          <div className="flex items-baseline">
            <span className="text-5xl font-semibold text-gray-900">${plan.prices[0].unit_amount / 100}</span>
            {plan.name !== "Free" && plan.name !== "Custom" && (
              <span className="ml-2 text-gray-500 text-sm">/month</span>
            )}
          </div>
        </div>
        <div className="mb-8">
          {plan.marketing_features.map((feature, index) => (
            <div key={index} className="flex items-start mb-3">
              <Check className="h-5 w-5 text-primary-500 mr-2 shrink-0 mt-0.5" />
              <p className="text-gray-600 text-sm">{feature.name}</p>
            </div>
          ))}
        </div>
      </div>
      <Button
        className={cn(
          "w-full py-6",
          isSubscribed 
            ? "bg-blue-400 text-gray-300 hover:bg-gray-200 cursor-not-allowed" 
            : "bg-blue-500 text-white hover:bg-blue-600"
        )}
        size="lg"
        onClick={() => onSubscribe(plan.name, plan.prices[0].id)}
        disabled={isSubscribed || isProcessing}
      >
        {isSubscribed 
          ? "Subscribed" 
          : isProcessing 
            ? "Processing..." 
            : "Get started"}
      </Button>
    </div>
  );
};

export default PricingCard;