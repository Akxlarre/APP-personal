export type SharedBlockStatus = 'pending' | 'accepted' | 'declined';

export interface SharedBlock {
  id: string;
  block_id: string;
  owner_id: string;
  invited_user_id: string;
  role?: string;
  status: SharedBlockStatus;
  confirmed_attendance: boolean;
  created_at?: string;
  updated_at?: string;
}
