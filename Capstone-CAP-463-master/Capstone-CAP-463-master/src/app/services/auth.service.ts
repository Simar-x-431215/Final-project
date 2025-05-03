import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  user$ = this.currentUserSubject.asObservable();
  
  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Check if user is stored in localStorage on service initialization
    this.checkUserInLocalStorage();
  }

  private checkUserInLocalStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // Email & Password Sign Up
  async emailSignUp(email: string, password: string, displayName: string): Promise<void> {
    try {
      // In a real app, this would call an API to create a user
      // For now, we'll simulate it with localStorage
      
      // Check if user already exists
      const users = this.getUsers();
      if (users.find(user => user.email === email)) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email,
        displayName
      };
      
      // Store user in "database" (localStorage)
      users.push({...newUser, password});
      localStorage.setItem('users', JSON.stringify(users));
      
      // Set as current user
      this.setCurrentUser(newUser);
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Email & Password Login
  async emailLogin(email: string, password: string): Promise<void> {
    try {
      // In a real app, this would call an API to authenticate
      // For now, we'll check against localStorage
      
      const users = this.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Set as current user (without the password)
      const { password: _, ...userWithoutPassword } = user;
      this.setCurrentUser(userWithoutPassword);
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    return Promise.resolve();
  }

  // Reset Password
  async resetPassword(email: string): Promise<void> {
    try {
      // In a real app, this would send a password reset email
      // For now, we'll just check if the user exists
      
      const users = this.getUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Simulate sending a reset email
      console.log(`Password reset email sent to ${email}`);
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Helper methods
  private getUsers(): any[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}