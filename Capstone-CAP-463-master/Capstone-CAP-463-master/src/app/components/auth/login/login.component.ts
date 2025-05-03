import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  standalone: true
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  returnUrl: string = '/';
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    try {
      const { email, password } = this.loginForm.value;
      await this.authService.emailLogin(email, password);
      this.router.navigate([this.returnUrl]);
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred during login. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async resetPassword(): Promise<void> {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.errorMessage = 'Please enter your email address to reset your password';
      return;
    }

    try {
      await this.authService.resetPassword(email);
      alert('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred. Please try again.';
    }
  }
}
