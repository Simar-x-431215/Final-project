import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FileUploadService } from '../../services/file-upload.service';
import { FileUpload } from '../../models/file-upload.model';
// import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hero',
  standalone: false,
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit {
  selectedFile: File | null = null;
  uploadProgress: number | null = null;
  uploadError: string | null = null;
  isUploading = false;
  uploadComplete = false;
  // showAuthModal: boolean = false;
  // processingComplete: boolean = false;
  // isLoading: boolean = false;
  // errorMessage: string = '';

  constructor(
    private router: Router,
    private fileUploadService: FileUploadService,
    // private authService: AuthService
  ) {}

  ngOnInit(): void {
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const fileSize = file.size / 1024 / 1024; // size in MB
      if (fileSize <= 5) {
        this.selectedFile = file;
        this.uploadError = null;
      } else {
        alert('File size exceeds the 5MB limit');
        event.target.value = '';
        this.selectedFile = null;
      }
    }
  }

  uploadCV(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file first';
      return;
    }

    this.isUploading = true;
    this.uploadError = null;
    this.uploadProgress = 0;
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress! < 100) {
        this.uploadProgress! += 5;
      } else {
        clearInterval(progressInterval);
        this.uploadComplete = true;
        // Navigate to results page after a short delay
        setTimeout(() => {
          this.router.navigate(['/results']);
        }, 500);
      }
    }, 150); // Completes in approximately 3 seconds

    // After 3 seconds, clear the interval if it's still running
    setTimeout(() => {
      clearInterval(progressInterval);
      this.uploadProgress = 100;
      this.isUploading = false;
      this.uploadComplete = true;
      this.router.navigate(['/results']);
    }, 3000);
  }

  // closeAuthModal(): void {
  //   this.showAuthModal = false;
  //   this.errorMessage = '';
  // }

  // async handleGoogleLogin(): Promise<void> {
  //   this.isLoading = true;
  //   this.errorMessage = '';
    
  //   try {
  //     await this.authService.googleLogin();
  //     this.showAuthResults();
  //   } catch (error) {
  //     this.isLoading = false;
  //     this.errorMessage = 'Google login failed. Please try again.';
  //   }
  // }

  // showAuthResults(): void {
  //   // Close the modal and navigate to results page
  //   this.showAuthModal = false;
  //   this.isLoading = false;
  //   this.router.navigate(['/results']);
  // }
}
