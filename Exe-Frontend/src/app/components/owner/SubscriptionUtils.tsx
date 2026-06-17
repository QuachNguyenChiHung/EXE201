import React from 'react';
import { SUBSCRIPTION_TIERS, SubscriptionTierLevel } from '../../../types';
import { Warehouse, Shield, Crown, Sparkles } from 'lucide-react';

export const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);

export const TIER_ICONS: Record<SubscriptionTierLevel, React.ReactNode> = {
  free: <Warehouse className="h-6 w-6" />,
  silver: <Shield className="h-6 w-6" />,
  gold: <Crown className="h-6 w-6" />,
  platinum: <Sparkles className="h-6 w-6" />,
};

export const getSponsorTierVisuals = (priorityLevel: number) => {
  if (priorityLevel === 0) return { color: '#6b7280', bgColor: '#f3f4f6', icon: <Warehouse className="h-6 w-6" /> };
  return { color: '#2563eb', bgColor: '#eff6ff', icon: <Crown className="h-6 w-6" /> }; // Use primary blue for sponsors
};

export const currentTier = (w: any) => w.subscriptionTier ?? 'free';
export const tierIdx = (t: SubscriptionTierLevel) => Object.keys(SUBSCRIPTION_TIERS).indexOf(t);
