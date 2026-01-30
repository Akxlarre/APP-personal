import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { NetworkService } from '../../../core/network/network.service';
import type { InventoryItem, MealSuggestion, InventoryCategory } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class InventoryRepository {
  private supabase = inject(SupabaseService);
  private sqlite = inject(SQLiteService);
  private network = inject(NetworkService);

  async getItems(userId: string): Promise<InventoryItem[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .order('name');
        if (!error && data) return data as InventoryItem[];
      } catch (e) {
        console.warn('Failed to fetch inventory', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM inventory_items WHERE user_id = ? ORDER BY name',
      [userId]
    );
    return (result.values || []) as InventoryItem[];
  }

  async addItem(
    userId: string,
    name: string,
    category: InventoryCategory,
    quantity: number,
    unit: string
  ): Promise<InventoryItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row: InventoryItem = {
      id,
      user_id: userId,
      name,
      category,
      quantity,
      unit,
      last_updated: now,
      created_at: now,
      updated_at: now,
    };
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        `INSERT INTO inventory_items (id, user_id, name, category, quantity, unit, synced)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [id, userId, name, category, quantity, unit]
      );
    }
    const { error } = await this.supabase.from('inventory_items').insert({
      id,
      user_id: userId,
      name,
      category,
      quantity,
      unit,
    });
    if (error) throw error;
    return row;
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    const now = new Date().toISOString();
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        'UPDATE inventory_items SET quantity = ?, last_updated = ? WHERE id = ?',
        [quantity, now, itemId]
      );
    }
    const { error } = await this.supabase
      .from('inventory_items')
      .update({ quantity, last_updated: now })
      .eq('id', itemId);
    if (error) throw error;
  }

  async deleteItem(itemId: string): Promise<void> {
    if (this.sqlite.db) {
      await this.sqlite.db.run('DELETE FROM inventory_items WHERE id = ?', [itemId]);
    }
    const { error } = await this.supabase.from('inventory_items').delete().eq('id', itemId);
    if (error) throw error;
  }

  async getMealSuggestions(): Promise<MealSuggestion[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('meal_suggestions')
          .select('*')
          .order('name');
        if (!error && data) return data as MealSuggestion[];
      } catch (e) {
        console.warn('Failed to fetch meal_suggestions', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM meal_suggestions ORDER BY name'
    );
    const raw = (result.values || []) as (MealSuggestion & { required_items?: string })[];
    return raw.map((r) => ({
      ...r,
      required_items: typeof r.required_items === 'string' ? JSON.parse(r.required_items || '{}') : r.required_items || {},
    }));
  }

  /**
   * Sugerencias que se pueden hacer con el inventario actual (required_items cubiertos).
   */
  getSuggestionsForInventory(
    suggestions: MealSuggestion[],
    items: InventoryItem[]
  ): MealSuggestion[] {
    const byName = new Map(items.map((i) => [i.name.toLowerCase(), i.quantity]));
    return suggestions.filter((s) => {
      for (const [name, required] of Object.entries(s.required_items || {})) {
        const have = byName.get(name.toLowerCase()) ?? 0;
        if (have < required) return false;
      }
      return true;
    });
  }
}
