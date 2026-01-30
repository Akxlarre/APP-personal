export type BlockCategory = 'work' | 'health' | 'home' | 'ceo' | 'social';

export interface Block {
  id: string;
  template_id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  is_critical: boolean;
  is_shared: boolean;
  category: BlockCategory;
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailySchedule {
  id: string;
  user_id: string;
  date: string;
  template_id: string;
  synced?: number;
  created_at?: string;
  updated_at?: string;
}

export type DailyBlockStatus = 'pending' | 'completed' | 'skipped' | 'in_debt';

export interface DailyBlock {
  id: string;
  schedule_id: string;
  original_block_id?: string;
  user_id: string;
  date: string;
  name: string;
  start_time: string;
  end_time: string;
  status: DailyBlockStatus;
  completion_note?: string;
  completed_at?: string;
  synced: number;
  local_updated_at?: string;
  server_updated_at?: string;
  created_at?: string;
  updated_at?: string;
}
