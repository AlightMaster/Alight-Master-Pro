export interface VerificationRecord {
  id: string;
  email: string;
  timestamp: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
  licenseKey: string;
  oobToken?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  badge: string;
  description: string;
  isIncluded: boolean;
}

export interface ActivityLog {
  id: string;
  emailMasked: string;
  timeAgo: string;
  statusText: string;
}
