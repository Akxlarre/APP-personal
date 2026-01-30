import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';

import { AuthService } from '../../../core/auth/auth.service';
import { TemplatesRepository } from '../services/templates.repository';
import { BlocksRepository } from '../../blocks/services/blocks.repository';
import type { Template } from '../../../shared/models';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">Templates</h2>
    @if (loading()) {
      <p class="text-surface-500">Cargando...</p>
    } @else if (templates().length === 0) {
      <p-card>
        <p class="text-surface-500 m-0 mb-3">
          No tienes templates. Crea uno para estructurar tu día.
        </p>
        <p-button label="Crear template" (onClick)="openDialog()" />
      </p-card>
    } @else {
      <div class="flex flex-col gap-3 mb-4">
        @for (t of templates(); track t.id) {
          <p-card>
            <div class="flex flex-wrap items-center gap-2 gap-y-3">
              <span class="flex-1 font-medium">{{ t.name }}</span>
              <span class="text-sm text-surface-500">
                {{ blockCounts()[t.id] ?? 0 }} bloques
              </span>
              <p-button
                label="Aplicar a hoy"
                severity="success"
                size="small"
                [loading]="applyingTemplateId() === t.id"
                (onClick)="applyToToday(t)"
              />
              <p-button
                label="Editar"
                severity="secondary"
                size="small"
                (onClick)="openDialog(t)"
              />
            </div>
          </p-card>
        }
      </div>
      <p-button label="+ Nuevo template" icon="pi pi-plus" (onClick)="openDialog()" />
    }

    <p-dialog
      [header]="editingTemplate() ? 'Editar template' : 'Nuevo template'"
      [(visible)]="dialogVisible"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(400px, 90vw)' }"
      (onHide)="cancelForm()"
    >
      <form [formGroup]="form" (ngSubmit)="saveTemplate()" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label for="name">Nombre</label>
          <input
            id="name"
            pInputText
            formControlName="name"
            placeholder="Ej: Turno Mañana"
            class="w-full"
          />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <small class="text-red-500">Nombre requerido (mín. 3 caracteres)</small>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="description">Descripción (opcional)</label>
          <textarea
            id="description"
            pInputTextarea
            formControlName="description"
            placeholder="Descripción opcional"
            rows="2"
            class="w-full"
          ></textarea>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" (onClick)="cancelForm()" />
        <p-button label="Guardar" (onClick)="saveTemplate()" [disabled]="form.invalid" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesListComponent implements OnInit {
  private auth = inject(AuthService);
  private repo = inject(TemplatesRepository);
  private blocksRepo = inject(BlocksRepository);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  applyingTemplateId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  templates = signal<Template[]>([]);
  blockCounts = signal<Record<string, number>>({});
  loading = signal(true);
  dialogVisible = false;
  editingTemplate = signal<Template | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private async load(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId) return;
    const list = await this.repo.getTemplates(userId);
    this.templates.set(list);
    const counts: Record<string, number> = {};
    for (const t of list) {
      const blocks = await this.repo.getBlocksByTemplateId(t.id);
      counts[t.id] = blocks.length;
    }
    this.blockCounts.set(counts);
    this.loading.set(false);
  }

  openDialog(t?: Template): void {
    this.editingTemplate.set(t ?? null);
    this.form.setValue({
      name: t?.name ?? '',
      description: t?.description ?? '',
    });
    this.dialogVisible = true;
  }

  cancelForm(): void {
    this.dialogVisible = false;
    this.editingTemplate.set(null);
  }

  async applyToToday(t: Template): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const blockCount = this.blockCounts()[t.id] ?? 0;
    if (blockCount === 0) return;
    this.applyingTemplateId.set(t.id);
    try {
      await this.blocksRepo.applyTemplateToDay(userId, t.id, today);
      await this.router.navigate(['/dashboard', 'hoy']);
    } finally {
      this.applyingTemplateId.set(null);
    }
  }

  async saveTemplate(): Promise<void> {
    if (this.form.invalid) return;
    const userId = this.auth.getUserId();
    const { name, description } = this.form.getRawValue();
    if (!userId || !name.trim()) return;
    const editing = this.editingTemplate();
    if (editing) {
      // TODO: update template cuando exista el método en el repo
      this.cancelForm();
      await this.load();
      return;
    }
    await this.repo.createTemplate(
      userId,
      name.trim(),
      description.trim() || undefined
    );
    this.cancelForm();
    await this.load();
  }
}
