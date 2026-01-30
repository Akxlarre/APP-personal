import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Router } from '@angular/router';
import type { User as SupabaseUser } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private currentUser = signal<SupabaseUser | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser.set(session?.user ?? null);
    });
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  async waitForSession(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    return !!data.session?.user;
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await this.router.navigate(['/dashboard']);
    }
    return { error: error ?? null };
  }

  async signUp(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    if (!error) {
      await this.router.navigate(['/dashboard']);
    }
    return { error: error ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }
}
