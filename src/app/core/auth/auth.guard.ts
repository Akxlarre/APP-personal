import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuth = await auth.waitForSession();
  if (isAuth) return true;
  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuth = await auth.waitForSession();
  if (!isAuth) return true;
  router.navigate(['/dashboard']);
  return false;
};
