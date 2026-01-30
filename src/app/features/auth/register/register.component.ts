import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    CardModule,
    MessageModule,
  ],
  template: `
    <div class="register-container">
      <p-card header="Crear cuenta">
        @if (error()) {
          <p-message severity="error" [text]="error()!" />
        }
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              pInputText
              formControlName="email"
              placeholder="Email"
              class="w-full"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <small class="text-red-500">Email requerido y válido</small>
            }
          </div>
          <div class="flex flex-col gap-1">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              pInputText
              formControlName="password"
              placeholder="Contraseña (mín. 6)"
              class="w-full"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <small class="text-red-500">Mínimo 6 caracteres</small>
            }
          </div>
          <p-button
            type="submit"
            label="{{ loading() ? 'Creando...' : 'Registrarme' }}"
            [loading]="loading()"
            [disabled]="form.invalid || loading()"
            styleClass="w-full"
          />
        </form>
        <ng-template pTemplate="footer">
          <a routerLink="/login" class="text-primary hover:underline">
            Ya tengo cuenta
          </a>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [
    `
      .register-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 1rem;
      }
      :host ::ng-deep .p-card .p-card-footer a {
        color: var(--primary-color);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
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
    const { error } = await this.auth.signUp(email, password);
    this.loading.set(false);
    if (error) {
      this.error.set(error.message ?? 'Error al registrar');
    }
  }
}
