export interface UserProfile {
  email: string;
  createdAt: string;
  timerDays: number;
  lastCheckIn: string | null;
}

export interface Secret {
  id: string;
  title: string;
  content: string;
  beneficiary: string;
  createdAt: string;
}
