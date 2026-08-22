export interface PlanConfig {
  name: string;
  price: number;
  monthlyQuota: number;
  description: string;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: "Free",
    price: 0,
    monthlyQuota: 50,
    description: "Perfect for trying out AltOptimizer",
  },
  starter: {
    name: "Starter",
    price: 9,
    monthlyQuota: 300,
    description: "For small stores getting started",
  },
  professional: {
    name: "Professional",
    price: 19,
    monthlyQuota: 1000,
    description: "For growing businesses",
  },
  business: {
    name: "Business",
    price: 49,
    monthlyQuota: 5000,
    description: "For high-volume stores",
  },
};
