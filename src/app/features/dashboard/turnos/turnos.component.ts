import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../../core/auth/auth.service';
import { TurnScheduleRepository } from './turn-schedule.repository';
import type { TurnSchedule, TurnType } from '../../../shared/models';

const TURN_TYPES: { label: string; value: TurnType }[] = [
  { label: 'Mañana', value: 'morning' },
  { label: 'Tarde', value: 'afternoon' },
  { label: 'Doble', value: 'double' },
  { label: 'Libre', value: 'off' },
];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, DropdownModule, TagModule],
  template: `
    <h2 class="text-xl font-semibold mb-4">Turnos de pareja</h2>

    <p-card header="Añadir / editar semana" styleClass="mb-4">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Inicio de semana (lunes)</label>
          <input type="date" pInputText [(ngModel)]="weekStart" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label>ID de tu pareja</label>
          <input pInputText [(ngModel)]="partnerId" placeholder="UUID" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Tipo de turno</label>
          <p-dropdown [(ngModel)]="selectedTurnType" [options]="turnTypes" optionLabel="label" optionValue="value" placeholder="Selecciona" styleClass="w-full" />
        </div>
        <p-button label="Guardar" [disabled]="!weekStart || !partnerId?.trim() || !selectedTurnType" (onClick)="save()" />
      </div>
    </p-card>

    <p-card header="Historial de turnos">
      @if (loading()) {
        <p class="m-0 text-surface-500">Cargando...</p>
      } @else if (turnList().length === 0) {
        <p class="m-0 text-surface-500">No hay turnos guardados.</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (t of turnList(); track t.id) {
            <div class="flex items-center justify-between gap-2 p-3 border border-surface-border rounded-lg">
              <span class="font-medium">Semana {{ t.week_start }}</span>
              <p-tag [value]="t.turn_type" [severity]="severity(t.turn_type)" />
            </div>
          }
        </div>
      }
    </p-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnosComponent implements OnInit {
  private auth = inject(AuthService);
  private repo = inject(TurnScheduleRepository);

  turnTypes = TURN_TYPES;
  loading = signal(true);
  turnList = signal<TurnSchedule[]>([]);
  weekStart = getWeekStart(new Date());
  partnerId = '';
  selectedTurnType: TurnType = 'morning';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.loading.set(true);
    const list = await this.repo.getByUser(userId);
    this.turnList.set(list);
    this.loading.set(false);
  }

  severity(t: TurnType): 'success' | 'info' | 'warning' | 'secondary' {
    if (t === 'off') return 'secondary';
    if (t === 'double') return 'warning';
    return t === 'morning' ? 'success' : 'info';
  }

  async save(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId || !this.weekStart || !this.partnerId?.trim() || !this.selectedTurnType) return;
    await this.repo.upsert(userId, this.partnerId.trim(), this.weekStart, this.selectedTurnType);
    await this.load();
  }
}
