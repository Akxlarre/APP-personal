import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div
        class="glass-card w-full max-w-md p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-[0_0_15px_-5px_rgba(139,92,246,0.15)] hover:bg-zinc-800/50 hover:shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)] transition-all"
      >
        <h1 class="text-white text-2xl font-semibold tracking-tight">Life Blocks</h1>
        <p class="text-white/60 text-sm mt-1 mb-6">Estructura tu día</p>
        @if (error()) {
          <div class="mb-4 p-3 rounded-lg bg-rose-600/20 border border-rose-600/50 text-rose-400 text-sm">
            {{ error() }}
          </div>
        }
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label for="email" class="text-white/80 text-sm">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
              class="input-glass w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-white placeholder:text-white/40 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <small class="text-rose-500 text-xs">Email requerido y válido</small>
            }
          </div>
          <div class="flex flex-col gap-1">
            <label for="password" class="text-white/80 text-sm">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="input-glass w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-white placeholder:text-white/40 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <small class="text-rose-500 text-xs">Mínimo 6 caracteres</small>
            }
          </div>
          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="btn-primary w-full py-3 rounded-xl bg-violet-600 text-white font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:bg-violet-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
        <p class="mt-5 text-center">
          <a
            routerLink="/login/register"
            class="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
          >
            Crear cuenta
          </a>
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .glass-card { }
      .input-glass { }
      .btn-primary { }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    const { error } = await this.auth.signIn(email, password);
    this.loading.set(false);
    if (error) {
      this.error.set(error.message ?? 'Error al entrar');
    }
  }
}
