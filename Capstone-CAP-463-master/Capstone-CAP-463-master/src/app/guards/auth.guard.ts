import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const isLoggedIn = this.authService.isLoggedIn();
    
    if (!isLoggedIn) {
      console.log('Access denied - Not logged in');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    }
    
    return of(isLoggedIn);
  }
}
