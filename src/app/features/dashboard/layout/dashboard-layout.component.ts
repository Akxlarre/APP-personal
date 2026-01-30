import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard flex flex-col min-h-screen bg-zinc-950">
      <header class="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <span class="text-white font-semibold text-xl tracking-tight">Life Blocks</span>
        <button
          type="button"
          (click)="auth.signOut()"
          class="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 active:scale-95 transition-all"
        >
          <i class="pi pi-sign-out"></i>
          Salir
        </button>
      </header>
      <nav class="flex gap-2 p-3 border-b border-white/10 bg-zinc-900/30">
        <a
          routerLink="/dashboard/hoy"
          routerLinkActive="nav-active"
          class="nav-link px-4 py-2.5 rounded-xl min-h-[44px] inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          Hoy
        </a>
        <a
          routerLink="/dashboard/templates"
          routerLinkActive="nav-active"
          class="nav-link px-4 py-2.5 rounded-xl min-h-[44px] inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          Templates
        </a>
        <a
          routerLink="/dashboard/shared"
          routerLinkActive="nav-active"
          class="nav-link px-4 py-2.5 rounded-xl min-h-[44px] inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          Compartidos
        </a>
        <a
          routerLink="/dashboard/inventory"
          routerLinkActive="nav-active"
          class="nav-link px-4 py-2.5 rounded-xl min-h-[44px] inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          Inventario
        </a>
        <a
          routerLink="/dashboard/turnos"
          routerLinkActive="nav-active"
          class="nav-link px-4 py-2.5 rounded-xl min-h-[44px] inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          Turnos
        </a>
      </nav>
      <main class="main flex-1 p-4">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .nav-link { text-decoration: none; }
      .nav-link.nav-active {
        color: rgb(139 92 246);
        font-weight: 600;
        background: rgba(139, 92, 246, 0.15);
        border: 1px solid rgba(139, 92, 246, 0.3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  auth = inject(AuthService);
}
