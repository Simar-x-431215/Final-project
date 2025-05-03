import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Job } from '../../models/job.model';
import { JobRecommenderService } from '../../services/job-recommender.service';

@Component({
  selector: 'app-saved-jobs',
  templateUrl: './saved-jobs.component.html',
  styleUrls: ['./saved-jobs.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SavedJobsComponent implements OnInit {
  savedJobs: Job[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  noSavedJobs: boolean = true;

  constructor(private jobRecommenderService: JobRecommenderService) { }

  ngOnInit(): void {
    this.loadSavedJobs();
  }

  /**
   * Load saved jobs from localStorage
   */
  loadSavedJobs(): void {
    this.isLoading = true;
    
    try {
      // Get saved jobs from localStorage
      const savedJobsJson = localStorage.getItem('savedJobs');
      
      if (savedJobsJson) {
        this.savedJobs = JSON.parse(savedJobsJson);
        this.noSavedJobs = this.savedJobs.length === 0;
        console.log('Loaded saved jobs:', this.savedJobs);
      } else {
        this.savedJobs = [];
        this.noSavedJobs = true;
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      this.errorMessage = 'Failed to load saved jobs.';
      this.savedJobs = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Remove a job from saved jobs
   */
  removeJob(jobId: string): void {
    // Find the job index
    const jobIndex = this.savedJobs.findIndex(job => job.id === jobId);
    
    if (jobIndex !== -1) {
      // Remove the job from the array
      this.savedJobs.splice(jobIndex, 1);
      
      // Update localStorage
      localStorage.setItem('savedJobs', JSON.stringify(this.savedJobs));
      
      // Update noSavedJobs flag
      this.noSavedJobs = this.savedJobs.length === 0;
      
      console.log('Job removed from saved jobs:', jobId);
    }
  }

  /**
   * Apply for a job
   */
  applyForJob(job: Job): void {
    if (job.url) {
      // Open the job URL in a new tab
      window.open(job.url, '_blank');
    } else if (job.id) {
      // If no direct URL, try to get application links from the service
      this.jobRecommenderService.getJobLinks(job.id).subscribe({
        next: (response: any) => {
          if (response.success && response.apply_link) {
            window.open(response.apply_link, '_blank');
          } else {
            alert('No application link available for this job.');
          }
        },
        error: (error) => {
          console.error('Error getting job application link:', error);
          alert('Failed to get application link for this job.');
        }
      });
    } else {
      alert('No application link available for this job.');
    }
  }

  /**
   * Clear all saved jobs
   */
  clearAllSavedJobs(): void {
    if (confirm('Are you sure you want to clear all saved jobs?')) {
      this.savedJobs = [];
      localStorage.removeItem('savedJobs');
      this.noSavedJobs = true;
      console.log('All saved jobs cleared');
    }
  }
}
