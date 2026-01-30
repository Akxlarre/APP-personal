export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  preferences?: {
    streak_freeze_count: number;
    notification_settings: Record<string, unknown>;
  };
}
