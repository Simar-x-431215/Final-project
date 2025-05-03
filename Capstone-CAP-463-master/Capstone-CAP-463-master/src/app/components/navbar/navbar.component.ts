import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isDropdownOpen: boolean = false;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
    // Ensure user state is checked on init
    if (!this.currentUser) {
      this.currentUser = this.authService.getCurrentUser();
    }
  }
  
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  async logout(): Promise<void> {
    try {
      this.isDropdownOpen = false;
      await this.authService.signOut();
      // Navigation is handled in the auth service
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
