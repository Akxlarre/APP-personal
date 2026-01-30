export type InventoryCategory = 'protein' | 'carb' | 'vegetable' | 'dairy' | 'condiment';

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  last_updated: string;
  synced?: number;
  created_at?: string;
  updated_at?: string;
}

export type MealCategory = 'quick' | 'normal' | 'elaborate';

export interface MealSuggestion {
  id: string;
  name: string;
  required_items: Record<string, number>;
  category: MealCategory;
  created_at?: string;
  updated_at?: string;
}
