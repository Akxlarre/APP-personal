export type TurnType = 'morning' | 'afternoon' | 'double' | 'off';

export interface TurnSchedule {
  id: string;
  user_id: string;
  partner_id: string;
  week_start: string;
  turn_type: TurnType;
  exceptions?: Record<string, string>;
  synced?: number;
  created_at?: string;
  updated_at?: string;
}
