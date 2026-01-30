import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../../core/auth/auth.service';
import { InventoryRepository } from '../services/inventory.repository';
import type { InventoryItem, MealSuggestion, InventoryCategory } from '../../../shared/models';

const CATEGORIES: { label: string; value: InventoryCategory }[] = [
  { label: 'Proteína', value: 'protein' },
  { label: 'Carbohidrato', value: 'carb' },
  { label: 'Verdura', value: 'vegetable' },
  { label: 'Lácteo', value: 'dairy' },
  { label: 'Condimento', value: 'condiment' },
];

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    DropdownModule,
    TagModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Inventario</h2>

    <p-card header="Mis productos" styleClass="mb-4">
      @if (loading()) {
        <p class="m-0 text-surface-500">Cargando...</p>
      } @else if (items().length === 0) {
        <p class="m-0 text-surface-500 mb-3">No tienes productos. Añade el primero.</p>
        <p-button label="Añadir producto" (onClick)="openDialog()" />
      } @else {
        <div class="flex flex-col gap-2 mb-3">
          @for (item of items(); track item.id) {
            <div class="flex items-center justify-between gap-2 p-3 border border-surface-border rounded-lg">
              <div>
                <span class="font-medium">{{ item.name }}</span>
                <p-tag [value]="item.category" severity="info" styleClass="ml-2" />
              </div>
              <span class="text-sm">{{ item.quantity }} {{ item.unit }}</span>
              <div class="flex gap-2">
                <p-button icon="pi pi-trash" severity="danger" [rounded]="true" size="small" (onClick)="deleteItem(item)" />
              </div>
            </div>
          }
        </div>
        <p-button label="+ Añadir producto" icon="pi pi-plus" (onClick)="openDialog()" />
      }
    </p-card>

    <p-card header="Sugerencias según tu inventario">
      @if (suggestionsForMe().length === 0) {
        <p class="m-0 text-surface-500">Añade productos para ver sugerencias de comidas.</p>
      } @else {
        <div class="flex flex-wrap gap-2">
          @for (s of suggestionsForMe(); track s.id) {
            <p-tag [value]="s.name" severity="success" />
          }
        </div>
      }
    </p-card>

    <p-dialog
      header="Nuevo producto"
      [(visible)]="dialogVisible"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(400px, 90vw)' }"
      (onHide)="cancelDialog()"
    >
      <form [formGroup]="form" (ngSubmit)="saveItem()" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Nombre</label>
          <input pInputText formControlName="name" placeholder="Ej: Pollo" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Categoría</label>
          <p-dropdown formControlName="category" [options]="categories" optionLabel="label" optionValue="value" placeholder="Selecciona" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Cantidad</label>
          <p-inputNumber formControlName="quantity" [minFractionDigits]="0" [maxFractionDigits]="2" placeholder="0" styleClass="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Unidad</label>
          <input pInputText formControlName="unit" placeholder="Ej: kg, unidades" class="w-full" />
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" (onClick)="cancelDialog()" />
        <p-button label="Guardar" (onClick)="saveItem()" [disabled]="form.invalid" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent implements OnInit {
  private auth = inject(AuthService);
  private repo = inject(InventoryRepository);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['protein' as InventoryCategory, Validators.required],
    quantity: [1, [Validators.required, Validators.min(0)]],
    unit: ['', Validators.required],
  });

  categories = CATEGORIES;
  loading = signal(true);
  items = signal<InventoryItem[]>([]);
  allSuggestions = signal<MealSuggestion[]>([]);
  suggestionsForMe = signal<MealSuggestion[]>([]);
  dialogVisible = false;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.loading.set(true);
    const [itemList, suggestions] = await Promise.all([
      this.repo.getItems(userId),
      this.repo.getMealSuggestions(),
    ]);
    this.items.set(itemList);
    this.allSuggestions.set(suggestions);
    this.suggestionsForMe.set(this.repo.getSuggestionsForInventory(suggestions, itemList));
    this.loading.set(false);
  }

  openDialog(): void {
    this.form.reset({ name: '', category: 'protein', quantity: 1, unit: '' });
    this.dialogVisible = true;
  }

  cancelDialog(): void {
    this.dialogVisible = false;
  }

  async saveItem(): Promise<void> {
    if (this.form.invalid) return;
    const userId = this.auth.getUserId();
    const { name, category, quantity, unit } = this.form.getRawValue();
    if (!userId) return;
    await this.repo.addItem(userId, name, category, quantity, unit);
    this.cancelDialog();
    await this.load();
  }

  async deleteItem(item: InventoryItem): Promise<void> {
    if (!confirm('¿Eliminar ' + item.name + '?')) return;
    await this.repo.deleteItem(item.id);
    await this.load();
  }
}
