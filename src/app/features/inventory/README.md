# Feature: Inventario + Sugerencias

## Propósito

Inventario básico de productos (proteína, carbohidrato, verdura, lácteo, condimento) y sugerencias de comidas según lo que tengas en inventario (required_items de meal_suggestions).

## Componentes principales

- **InventoryListComponent**: lista de productos (añadir, eliminar), dialog para nuevo producto, sección "Sugerencias según tu inventario" (tags de comidas que puedes hacer).

## Servicios y dependencias

- **InventoryRepository**: operaciones sobre `inventory_items` y `meal_suggestions`.
  - `getItems(userId)`, `addItem(...)`, `updateQuantity(itemId, quantity)`, `deleteItem(itemId)`, `getMealSuggestions()`, `getSuggestionsForInventory(suggestions, items)`.
- Depende de: `SupabaseService`, `SQLiteService`, `NetworkService`.

## Ejemplos de uso

```typescript
private repo = inject(InventoryRepository);

const items = await this.repo.getItems(userId);
const suggestions = await this.repo.getMealSuggestions();
const forMe = this.repo.getSuggestionsForInventory(suggestions, items);
await this.repo.addItem(userId, 'Pollo', 'protein', 1, 'kg');
```
