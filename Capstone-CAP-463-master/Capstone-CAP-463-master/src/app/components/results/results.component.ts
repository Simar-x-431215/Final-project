import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FileUploadService } from '../../services/file-upload.service';
import { CvAnalysisService } from '../../services/cv-analysis.service';
import { JobRecommenderService } from '../../services/job-recommender.service';
import {
  FileUpload,
  ResumeUploadResponse,
  Job,
  JobRecommendationResponse,
  SkillRecommendationResponse,
  CourseRecommendationResponse
} from '../../models/file-upload.model';

@Component({
  selector: 'app-results',
  standalone: false,
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {
  // Data objects
  extractedSkills: string[] = [];
  skillsText: string = '';
  recommendedSkills: string[] = [];
  recommendedJobs: Job[] = [];
  recommendedCourses: any[] = [];
  selectedFile: File | null = null;
  fileUploads: any[] = [];
  currentAnalysis: any = null;
  resumeFileName: string = '';
  analysisTimestamp: string = '';
  isApiError: boolean = false; // Changed from isFallback to isApiError
  
  // UI state
  activeTab: string = 'skills'; // Default active tab
  isLoading: boolean = false;
  errorMessage: string = '';
  uploadSuccess: boolean = false;
  showConfetti: boolean = false;
  
  // For file upload progress
  uploadProgress: number = 0;

  constructor(
    private fileUploadService: FileUploadService,
    private cvAnalysisService: CvAnalysisService,
    private jobRecommenderService: JobRecommenderService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
  
  ngOnInit(): void {
    // First check localStorage for previously saved analysis
    this.checkForSavedAnalysis();
    
    // Then check if we've been passed skills via query params (from another component)
    this.route.queryParams.subscribe(params => {
      if (params['skills']) {
        this.skillsText = params['skills'];
        this.extractedSkills = this.skillsText.split(',').map(skill => skill.trim());
        this.loadAllRecommendations();
      }
    });
  }

  // Check localStorage for any saved analysis data
  checkForSavedAnalysis(): void {
    const savedAnalysis = localStorage.getItem('resumeAnalysis');
    if (savedAnalysis) {
      try {
        const analysisData = JSON.parse(savedAnalysis);
        this.extractedSkills = analysisData.skills || [];
        this.skillsText = analysisData.skillsText || '';
        this.recommendedSkills = analysisData.recommendedSkills || [];
        this.recommendedJobs = analysisData.jobs || [];
        this.recommendedCourses = analysisData.courses || [];
        this.resumeFileName = analysisData.fileName || '';
        this.analysisTimestamp = analysisData.timestamp || '';
        this.uploadSuccess = true;
        this.currentAnalysis = { id: analysisData.resumeId };
        
        // Only reload recommendations if we don't have them already
        if (!this.recommendedSkills.length || !this.recommendedJobs.length) {
          this.loadAllRecommendations();
        }
      } catch (error) {
        console.error('Error parsing saved analysis:', error);
        // Clear corrupted data
        localStorage.removeItem('resumeAnalysis');
      }
    }
  }

  // Save current analysis to localStorage
  saveAnalysisToLocalStorage(): void {
    const currentTime = new Date().toISOString();
    this.analysisTimestamp = currentTime;
    
    const analysisData = {
      skills: this.extractedSkills,
      skillsText: this.skillsText,
      recommendedSkills: this.recommendedSkills,
      jobs: this.recommendedJobs,
      courses: this.recommendedCourses,
      fileName: this.resumeFileName,
      timestamp: currentTime,
      resumeId: this.currentAnalysis?.id || null
    };
    
    localStorage.setItem('resumeAnalysis', JSON.stringify(analysisData));
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? null;
    // Reset data when a new file is selected
    this.resetData();
  }

  removeSelectedFile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedFile = null;
    // Reset the file input
    const fileInput = document.getElementById('resumeFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  resetData(): void {
    this.extractedSkills = [];
    this.skillsText = '';
    this.recommendedSkills = [];
    this.recommendedJobs = [];
    this.recommendedCourses = [];
    this.errorMessage = '';
    this.uploadSuccess = false;
    this.resumeFileName = '';
    this.analysisTimestamp = '';
    this.currentAnalysis = null;
    this.isApiError = false; // Reset error flag
    
    // Clear localStorage when resetting data
    localStorage.removeItem('resumeAnalysis');
  }

  uploadResume(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.resumeFileName = this.selectedFile.name;

    // Create a FileUpload object
    const fileUpload = new FileUpload(this.selectedFile);
    
    // Simulate processing animation for at least 1.5 seconds
    const startTime = new Date().getTime();
    const minimumProcessingTime = 1500; // 1.5 seconds minimum showing animation
    
    this.fileUploadService.uploadFile(fileUpload).subscribe({
      next: (response: ResumeUploadResponse) => {
        if (response.success) {
          this.extractedSkills = response.skills || [];
          this.skillsText = response.skills_text || '';
          this.currentAnalysis = { id: response.id }; // Use response.id instead of response.analysis
          
          // Ensure minimum processing time for animation effect
          const currentTime = new Date().getTime();
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime < minimumProcessingTime) {
            setTimeout(() => {
              this.uploadSuccess = true;
              this.isLoading = false;
              this.triggerConfetti();
              this.onSkillExtractionComplete();
              // Save to localStorage after data is loaded
              this.saveAnalysisToLocalStorage();
            }, minimumProcessingTime - elapsedTime);
          } else {
            this.uploadSuccess = true;
            this.isLoading = false;
            this.triggerConfetti();
            this.onSkillExtractionComplete();
            // Save to localStorage after data is loaded
            this.saveAnalysisToLocalStorage();
          }
        } else {
          this.errorMessage = response.error || 'Failed to process resume';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage = 'Error uploading file: ' + (error.message || 'Unknown error');
        this.isLoading = false;
      }
    });
  }

  loadAllRecommendations(): void {
    if (!this.skillsText) {
      this.errorMessage = 'No skills available for recommendations';
      return;
    }

    // Load all recommendations in parallel
    this.getJobRecommendations();
    this.getSkillRecommendations();
    this.getCourseRecommendations();
  }

  getJobRecommendations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.isApiError = false;
    
    // Check if we have extracted skills
    if (this.extractedSkills && this.extractedSkills.length > 0) {
      // Use all extracted skills for a comprehensive search
      const allSkills = this.extractedSkills;
      
      // Format skills with quotes for exact matching
      const formattedQuery = allSkills
        .map(skill => `"${skill.trim()}"`)
        .join(' OR ');
      
      console.log('Using ALL skills for job search:', formattedQuery);
      
      // Call the real-time job search API with all skills and request more results
      this.jobRecommenderService.searchRealTimeJobs({
        query: formattedQuery,
        location: 'India', // Default location
        page: '1',
        num_pages: '3' // Request 3 pages of results to get more jobs
      }).subscribe({
        next: (response: any) => {
          console.log('Real-time job API response:', response);
          
          if (response && response.success && response.jobs && response.jobs.length > 0) {
            this.recommendedJobs = response.jobs;
            this.errorMessage = '';
            this.isApiError = false;
            console.log(`SUCCESS: Found ${response.jobs.length} jobs from API`);
          } else {
            this.recommendedJobs = [];
            this.errorMessage = response.error || 'No jobs found matching your skills.';
            this.isApiError = true;
            console.log('ERROR: No jobs available in response');
          }
          // Update localStorage with new job data
          this.saveAnalysisToLocalStorage();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Real-time job API error:', error);
          this.recommendedJobs = [];
          this.errorMessage = 'An error occurred while fetching jobs.';
          this.isApiError = true;
          this.isLoading = false;
        }
      });
    } else if (this.skillsText) {
      // If no extracted skills but we have skills text, use that instead
      this.jobRecommenderService.getJobRecommendations(this.skillsText).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.recommendedJobs = response.jobs;
            // Update localStorage with new job data
            this.saveAnalysisToLocalStorage();
          } else {
            console.error('Job recommendation error:', response.error);
            this.errorMessage = response.error || 'Failed to get job recommendations.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Job recommendation error:', error);
          this.errorMessage = 'An error occurred while fetching job recommendations.';
          this.isLoading = false;
        }
      });
    } else {
      // No skills available
      this.errorMessage = 'No skills available for job recommendations.';
      this.isLoading = false;
    }
  }

  getSkillRecommendations(): void {
    this.jobRecommenderService.getSkillRecommendations(this.skillsText).subscribe({
      next: (response: SkillRecommendationResponse) => {
        if (response.success) {
          this.recommendedSkills = response.recommended_skills;
          // Update localStorage with new skill data
          this.saveAnalysisToLocalStorage();
        } else {
          console.error('Skill recommendation error:', response.error);
        }
      },
      error: (error) => console.error('Skill recommendation error:', error)
    });
  }

  getCourseRecommendations(): void {
    // Get course recommendations based on the first extracted skill or job title
    const searchTerm = this.extractedSkills.length > 0 ? this.extractedSkills[0] : 'Data Science';
    
    this.jobRecommenderService.getCourseRecommendations(searchTerm).subscribe({
      next: (response: CourseRecommendationResponse) => {
        if (response.success) {
          this.recommendedCourses = response.courses;
          // Update localStorage with new course data
          this.saveAnalysisToLocalStorage();
        } else {
          console.error('Course recommendation error:', response.error);
        }
      },
      error: (error) => console.error('Course recommendation error:', error)
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  saveJob(job: Job): void {
    console.log('Saving job:', job);
    
    // Add timestamp to the job
    const jobToSave = {
      ...job,
      date_saved: new Date().toISOString()
    };
    
    // Get existing saved jobs from localStorage
    let savedJobs: Job[] = [];
    const savedJobsJson = localStorage.getItem('savedJobs');
    
    if (savedJobsJson) {
      savedJobs = JSON.parse(savedJobsJson);
    }
    
    // Check if job is already saved
    const jobExists = savedJobs.some(savedJob => savedJob.id === job.id);
    
    if (!jobExists) {
      // Add the new job to the saved jobs array
      savedJobs.push(jobToSave);
      
      // Save the updated array back to localStorage
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
      
      // Show success notification
      alert('Job saved successfully! View it in your Saved Jobs.');
      console.log('Job saved to localStorage');
    } else {
      // Job already exists in saved jobs
      alert('This job is already in your saved jobs.');
      console.log('Job already exists in saved jobs');
    }
  }

  getJobLinks(jobId: string): void {
    // Find the job in the recommended jobs array
    const job = this.recommendedJobs.find(j => j.id === jobId);
    
    if (job && job.url && job.url !== '#') {
      // If the job has a direct URL, open it
      console.log('Opening job application URL:', job.url);
      window.open(job.url, '_blank');
    } else {
      // Show an alert if no application URL is available
      console.log('No application URL available for job ID:', jobId);
      alert('Sorry, direct application link is not available for this job. Please search for this position on the company website.');
    }
  }

  openCourse(courseUrl: string): void {
    window.open(courseUrl, '_blank');
  }

  // Navigate to advanced CV analysis
  goToAdvancedAnalysis(): void {
    // Check if we have a resume ID
    if (this.currentAnalysis?.id) {
      this.router.navigate(['/cv-analysis', this.currentAnalysis.id]);
    } else {
      // Try to get the resume ID from localStorage
      const savedAnalysis = localStorage.getItem('resumeAnalysis');
      if (savedAnalysis) {
        try {
          const analysisData = JSON.parse(savedAnalysis);
          if (analysisData.resumeId) {
            this.router.navigate(['/cv-analysis', analysisData.resumeId]);
            return;
          }
        } catch (error) {
          console.error('Error parsing saved analysis:', error);
        }
      }
      
      // If we still don't have a resume ID, show an error
      this.errorMessage = 'Unable to perform advanced analysis. Please upload your resume again.';
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    }
  }

  // Methods for confetti animation
  getRandomColor(): string {
    const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getRandomDistance(): number {
    return Math.floor(Math.random() * 100);
  }

  triggerConfetti(): void {
    this.showConfetti = true;
    setTimeout(() => {
      this.showConfetti = false;
    }, 4000); // Hide confetti after 4 seconds
  }

  // Format timestamp for display
  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        // Format as date if it's older than a week
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Recently';
    }
  }

  // After skill extraction, call this method to fetch jobs
  onSkillExtractionComplete(): void {
    console.log('Skill extraction complete, fetching job recommendations...');
    // Directly call getJobRecommendations to fetch jobs based on extracted skills
    this.getJobRecommendations();
  }

  // Fetch real-time jobs from JSearch API using extracted skills
  fetchRealTimeJobsFromJSearchApi(): void {
    // Simply call the getJobRecommendations method which uses the real-time API
    this.getJobRecommendations();
  }

  // Refresh jobs - new method to retry job search
  refreshJobs(): void {
    this.getJobRecommendations();
  }

  // Method to navigate to job skills view
  viewJobSkills(job: Job): void {
    // Store the job details in localStorage for the job skills component
    const analysisData = {
      ...JSON.parse(localStorage.getItem('recentAnalysis') || '{}'),
      recommendedJobs: [
        ...(JSON.parse(localStorage.getItem('recentAnalysis') || '{}').recommendedJobs || [])
          .filter((j: Job) => j.id !== job.id),
        job
      ]
    };
    
    localStorage.setItem('recentAnalysis', JSON.stringify(analysisData));
    
    // Navigate to job skills view
    this.router.navigate(['/job-skills', job.id]);
  }
}
