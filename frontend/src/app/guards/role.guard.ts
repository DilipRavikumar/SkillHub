import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const currentUser = this.authService.getCurrentUser();
    const allowedRoles = route.data['roles'] as string[];

    console.log('RoleGuard - Current User:', currentUser);
    console.log('RoleGuard - Allowed Roles:', allowedRoles);
    console.log('RoleGuard - User Role:', currentUser?.role);

    if (!currentUser) {
      console.log('RoleGuard - No current user, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // Redirect admins to admin panel instead of dashboard
    if (currentUser.role === 'ADMIN') {
      // If trying to access dashboard or other routes, redirect to admin panel
      if (this.router.url === '/dashboard' || this.router.url.includes('/dashboard')) {
        console.log('RoleGuard - Admin trying to access dashboard, redirecting to admin panel');
        this.router.navigate(['/admin']);
        return false;
      }
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (allowedRoles.includes(currentUser.role)) {
        console.log('RoleGuard - User has required role, allowing access');
        return true;
      } else {
        // Redirect based on role
        if (currentUser.role === 'ADMIN') {
          console.log('RoleGuard - User is admin, redirecting to admin panel');
          this.router.navigate(['/admin']);
        } else {
          console.log('RoleGuard - User does not have required role, redirecting to dashboard');
          this.router.navigate(['/dashboard']);
        }
        return false;
      }
    }

    return true;
  }
}

