import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { JobRecommenderService } from '../../services/job-recommender.service';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-job-skills',
  templateUrl: './job-skills.component.html',
  styleUrls: ['./job-skills.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule]
})
export class JobSkillsComponent implements OnInit {
  jobId: string = '';
  jobTitle: string = '';
  jobCompany: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  requiredSkills: string[] = [];
  job: Job | null = null;
  userSkills: string[] = [];
  missingSkills: string[] = [];
  matchedSkills: string[] = [];
  skillsLoaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobRecommenderService: JobRecommenderService
  ) { }

  ngOnInit(): void {
    // Get job ID from route parameters
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      if (this.jobId) {
        this.loadJobDetails();
        this.loadRequiredSkills();
      } else {
        this.errorMessage = 'No job ID provided';
        this.isLoading = false;
      }
    });

    // Get user skills from localStorage if available
    this.loadUserSkills();
  }

  /**
   * Load job details from localStorage or API
   */
  loadJobDetails(): void {
    // First try to find the job in localStorage (saved jobs)
    const savedJobsJson = localStorage.getItem('savedJobs');
    if (savedJobsJson) {
      const savedJobs = JSON.parse(savedJobsJson);
      this.job = savedJobs.find((job: Job) => job.id === this.jobId);
    }

    // If not found in saved jobs, check recent jobs from results
    if (!this.job) {
      const recentAnalysisJson = localStorage.getItem('recentAnalysis');
      if (recentAnalysisJson) {
        const recentAnalysis = JSON.parse(recentAnalysisJson);
        if (recentAnalysis.recommendedJobs) {
          this.job = recentAnalysis.recommendedJobs.find((job: Job) => job.id === this.jobId);
        }
      }
    }

    // If job found, set title and company
    if (this.job) {
      this.jobTitle = this.job.title;
      this.jobCompany = this.job.company;
    } else {
      // If not found locally, fetch from API
      this.jobRecommenderService.getJobDetails(this.jobId).subscribe({
        next: (response: any) => {
          if (response.success && response.job) {
            this.job = response.job;
            this.jobTitle = this.job?.title || 'Job Title';
            this.jobCompany = this.job?.company || 'Company';
          } else {
            this.errorMessage = 'Failed to load job details';
          }
        },
        error: (error: any) => {
          console.error('Error loading job details:', error);
          this.errorMessage = 'Error loading job details';
        }
      });
    }
  }

  /**
   * Load required skills for the job
   */
  loadRequiredSkills(): void {
    this.isLoading = true;
    
    // Call the API to get required skills for this job
    this.jobRecommenderService.getJobRequiredSkills(this.jobId).subscribe({
      next: (response: any) => {
        if (response.success && response.skills && response.skills.length > 0) {
          this.requiredSkills = response.skills;
          this.compareWithUserSkills();
          this.skillsLoaded = true;
        } else {
          this.errorMessage = 'No skills found for this job';
          this.skillsLoaded = false;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading required skills:', error);
        this.errorMessage = 'Error loading required skills';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load user skills from localStorage
   */
  loadUserSkills(): void {
    const recentAnalysisJson = localStorage.getItem('recentAnalysis');
    if (recentAnalysisJson) {
      const recentAnalysis = JSON.parse(recentAnalysisJson);
      if (recentAnalysis.extractedSkills && recentAnalysis.extractedSkills.length > 0) {
        this.userSkills = recentAnalysis.extractedSkills;
      }
    }
  }

  /**
   * Compare user skills with required skills
   */
  compareWithUserSkills(): void {
    if (this.userSkills.length > 0 && this.requiredSkills.length > 0) {
      // Convert all skills to lowercase for case-insensitive comparison
      const userSkillsLower = this.userSkills.map(skill => skill.toLowerCase());
      
      // Find matched and missing skills
      this.matchedSkills = this.requiredSkills.filter(skill => 
        userSkillsLower.includes(skill.toLowerCase())
      );
      
      this.missingSkills = this.requiredSkills.filter(skill => 
        !userSkillsLower.includes(skill.toLowerCase())
      );
    } else {
      // If no user skills, all required skills are missing
      this.missingSkills = this.requiredSkills;
      this.matchedSkills = [];
    }
  }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    this.router.navigate(['/results']);
  }

  /**
   * Apply for the job
   */
  applyForJob(): void {
    if (this.job && this.job.url) {
      window.open(this.job.url, '_blank');
    } else if (this.jobId) {
      this.jobRecommenderService.getJobLinks(this.jobId).subscribe({
        next: (response: any) => {
          if (response.success && response.apply_link) {
            window.open(response.apply_link, '_blank');
          } else {
            alert('No application link available for this job.');
          }
        },
        error: (error: any) => {
          console.error('Error getting job application link:', error);
          alert('Failed to get application link for this job.');
        }
      });
    }
  }
}
