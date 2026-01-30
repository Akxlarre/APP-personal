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
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../../core/auth/auth.service';
import { SharedBlocksRepository } from '../services/shared-blocks.repository';
import { TemplatesRepository } from '../../templates/services/templates.repository';
import type { SharedBlock } from '../../../shared/models';
import type { Block } from '../../../shared/models';

@Component({
  selector: 'app-shared-blocks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, InputTextModule],
  template: `
    <h2 class="text-xl font-semibold mb-4">Compartidos</h2>

    <p-card header="Invitaciones recibidas" styleClass="mb-4">
      @if (loading()) {
        <p class="m-0 text-surface-500">Cargando...</p>
      } @else if (invitations().length === 0) {
        <p class="m-0 text-surface-500">No tienes invitaciones pendientes.</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (inv of invitations(); track inv.id) {
            <div class="flex items-center justify-between gap-2 p-2 border border-surface-border rounded-lg">
              <span class="text-sm">Bloque ID: {{ inv.block_id | slice:0:8 }}...</span>
              <p-tag [value]="inv.status" [severity]="inv.status === 'pending' ? 'warning' : inv.status === 'accepted' ? 'success' : 'secondary'" />
              @if (inv.status === 'pending') {
                <div class="flex gap-2">
                  <p-button label="Aceptar" severity="success" size="small" (onClick)="accept(inv)" />
                  <p-button label="Rechazar" severity="secondary" size="small" (onClick)="decline(inv)" />
                </div>
              }
            </div>
          }
        </div>
      }
    </p-card>

    <p-card header="Bloques que compartí" styleClass="mb-4">
      @if (sharedByMe().length === 0) {
        <p class="m-0 text-surface-500">No has compartido ningún bloque.</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (s of sharedByMe(); track s.id) {
            <div class="flex items-center gap-2 p-2 border border-surface-border rounded-lg">
              <span class="text-sm">Bloque {{ s.block_id | slice:0:8 }}... → {{ s.invited_user_id | slice:0:8 }}...</span>
              <p-tag [value]="s.status" [severity]="s.status === 'accepted' ? 'success' : s.status === 'pending' ? 'warning' : 'secondary'" />
            </div>
          }
        </div>
      }
    </p-card>

    <p-card header="Invitar a un bloque">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Bloque (template)</label>
          <select class="p-2 border rounded" [(ngModel)]="selectedBlockId" (ngModelChange)="onBlockChange($event)">
            <option value="">Selecciona un bloque</option>
            @for (b of availableBlocks(); track b.id) {
              <option [value]="b.id">{{ b.name }} ({{ b.start_time }}-{{ b.end_time }})</option>
            }
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label>ID del usuario a invitar</label>
          <input pInputText [(ngModel)]="invitedUserId" placeholder="UUID del compañero" class="w-full" />
        </div>
        <p-button label="Enviar invitación" [disabled]="!selectedBlockId || !invitedUserId?.trim()" (onClick)="sendInvite()" />
      </div>
    </p-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedBlocksListComponent implements OnInit {
  private auth = inject(AuthService);
  private sharedRepo = inject(SharedBlocksRepository);
  private templatesRepo = inject(TemplatesRepository);

  loading = signal(true);
  invitations = signal<SharedBlock[]>([]);
  sharedByMe = signal<SharedBlock[]>([]);
  availableBlocks = signal<Block[]>([]);
  selectedBlockId = '';
  invitedUserId = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.loading.set(true);
    const [inv, byMe] = await Promise.all([
      this.sharedRepo.getInvitationsForUser(userId),
      this.sharedRepo.getSharedByOwner(userId),
    ]);
    this.invitations.set(inv);
    this.sharedByMe.set(byMe);
    await this.loadBlocks(userId);
    this.loading.set(false);
  }

  private async loadBlocks(userId: string): Promise<void> {
    const templates = await this.templatesRepo.getTemplates(userId);
    const all: Block[] = [];
    for (const t of templates) {
      const blocks = await this.templatesRepo.getBlocksByTemplateId(t.id);
      all.push(...blocks);
    }
    this.availableBlocks.set(all);
  }

  onBlockChange(_value: string): void {}

  async sendInvite(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId || !this.selectedBlockId || !this.invitedUserId?.trim()) return;
    await this.sharedRepo.invite(this.selectedBlockId, userId, this.invitedUserId.trim());
    this.selectedBlockId = '';
    this.invitedUserId = '';
    await this.load();
  }

  async accept(inv: SharedBlock): Promise<void> {
    await this.sharedRepo.accept(inv.id);
    await this.load();
  }

  async decline(inv: SharedBlock): Promise<void> {
    await this.sharedRepo.decline(inv.id);
    await this.load();
  }
}
