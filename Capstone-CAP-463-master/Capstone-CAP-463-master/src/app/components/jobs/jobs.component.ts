import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { JobRecommenderService } from '../../services/job-recommender.service';
import { IntegratedWorkflowService } from '../../services/integrated-workflow.service';
import { 
  Job, 
  JobRecommendationResponse, 
  SkillRecommendationResponse,
  FileUpload,
  ResumeUploadResponse
} from '../../models/file-upload.model';

@Component({
  selector: 'app-jobs',
  standalone: false,
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css'
})
export class JobsComponent implements OnInit {
  jobs: Job[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchQuery: string = '';
  searchLocation: string = '';
  remoteOption: string = '';
  noResultsFound: boolean = false;
  
  // Remote work checkbox properties
  isRemoteChecked: boolean = false;
  isNonRemoteChecked: boolean = false;
  
  // Add extracted skills property
  extractedSkills: string[] = [];
  
  // Helper method to get object keys for template
  objectKeys = Object.keys;

  constructor(
    private router: Router,
    private jobRecommenderService: JobRecommenderService,
    private workflowService: IntegratedWorkflowService
  ) { }

  ngOnInit(): void {
    // Check if there are extracted skills in localStorage
    this.checkForExtractedSkills();
    
    // If we have extracted skills, use them to search for jobs
    if (this.extractedSkills && this.extractedSkills.length > 0) {
      this.searchJobsWithExtractedSkills();
    } else {
      // Otherwise, initialize component with recent jobs
      this.getRecentJobs();
    }
  }

  searchJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.noResultsFound = false;
    this.jobs = []; // Clear any existing jobs

    // If no query is provided, use an empty string
    const query = this.searchQuery || '';
    
    if (!query) {
      this.errorMessage = 'Please enter a search term';
      this.isLoading = false;
      return;
    }

    // Format location properly if provided
    let location = '';
    if (this.searchLocation && this.searchLocation.trim() !== '') {
      location = this.searchLocation.trim();
      console.log('Using location in search:', location);
    }

    // Prepare parameters for the API call - include all user filters
    const searchParams = {
      query: query,
      location: location, // Properly formatted location
      remote_only: this.remoteOption || '', // Pass empty string if not provided
      employment_types: "fulltime;parttime;intern;contractor"
    };

    console.log('Searching for jobs with query:', query);
    console.log('Search parameters:', searchParams);
    console.log('Location filter:', location);
    console.log('Remote option:', this.remoteOption);

    // Call the API to fetch real-time jobs
    this.jobRecommenderService.searchJobs(searchParams).subscribe({
      next: (response: any) => {
        console.log('API response for manual search:', response);
        if (response.success && response.jobs && response.jobs.length > 0) {
          this.jobs = response.jobs;
          
          // Only perform client-side filtering if needed (API didn't filter properly)
          if (location && this.shouldPerformClientSideFiltering(this.jobs, location)) {
            this.filterJobsByLocation();
          }
        } else {
          this.noResultsFound = true;
          this.errorMessage = response.error || 'No jobs found matching your search criteria. Try different keywords or filters.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Job search error:', error);
        this.errorMessage = 'Error searching for jobs: ' + (error.message || 'Unknown error');
        this.noResultsFound = true;
        this.isLoading = false;
      }
    });
  }

  getRecentJobs(): void {
    this.isLoading = true;
    this.jobRecommenderService.getRecentJobs().subscribe({
      next: (response: any) => {
        if (response.success && response.jobs && response.jobs.length > 0) {
          this.jobs = response.jobs;
        } else {
          this.noResultsFound = true;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching recent jobs:', error);
        this.noResultsFound = true;
        this.isLoading = false;
      }
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.searchLocation = '';
    this.remoteOption = '';
    this.isRemoteChecked = false;
    this.isNonRemoteChecked = false;
    this.jobs = [];
    this.errorMessage = '';
    this.noResultsFound = false;
    
    // Reload recent jobs
    this.getRecentJobs();
  }

  updateRemoteOption(): void {
    if (this.isRemoteChecked && !this.isNonRemoteChecked) {
      // Only remote jobs
      this.remoteOption = 'true';
    } else if (!this.isRemoteChecked && this.isNonRemoteChecked) {
      // Only non-remote jobs
      this.remoteOption = 'false';
    } else {
      // Both checked or both unchecked means "any"
      this.remoteOption = '';
    }
    console.log('Remote option updated:', this.remoteOption);
  }

  showJobDetails(job: any): void {
    console.log('Showing details for job:', job);
    
    // If the job has a direct URL, open it
    if (job.url && job.url !== '#') {
      console.log('Opening job application URL:', job.url);
      window.open(job.url, '_blank');
      return;
    }
    
    // For jobs with no URL, show details in an alert
    // Format skills list
    const skills = job.skills && job.skills.length > 0 
      ? job.skills.join(', ') 
      : 'No specific skills listed';
    
    // Create a detailed message
    const jobDetails = `
Job: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.job_type || 'Not specified'}
Posted: ${job.posted_date || 'Recently'}

Description:
${job.description}

Required Skills:
${skills}

Application: No direct application link is available for this job. Please search for this position on the company website.`;
    
    // Show the alert with job details
    alert(jobDetails);
  }

  // Check localStorage for extracted skills
  checkForExtractedSkills(): void {
    const savedAnalysis = localStorage.getItem('resumeAnalysis');
    if (savedAnalysis) {
      try {
        const analysis = JSON.parse(savedAnalysis);
        if (analysis.extractedSkills && Array.isArray(analysis.extractedSkills) && analysis.extractedSkills.length > 0) {
          this.extractedSkills = analysis.extractedSkills;
          console.log('Found extracted skills in localStorage:', this.extractedSkills);
        }
      } catch (error) {
        console.error('Error parsing saved analysis:', error);
      }
    }
  }

  // New method to search jobs using extracted skills
  searchJobsWithExtractedSkills(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.noResultsFound = false;
    this.jobs = []; // Clear any existing jobs
    
    console.log('Searching for jobs with extracted skills:', this.extractedSkills);
    
    // Format location properly if provided
    let location = '';
    if (this.searchLocation && this.searchLocation.trim() !== '') {
      location = this.searchLocation.trim();
      console.log('Using location in search with extracted skills:', location);
    }
    
    // Call the API to fetch real-time jobs based on extracted skills
    this.jobRecommenderService.searchJobsBySkills(this.extractedSkills, location).subscribe({
      next: (response: any) => {
        console.log('API response for skills-based search:', response);
        if (response.success && response.jobs && response.jobs.length > 0) {
          this.jobs = response.jobs;
          
          // Only perform client-side filtering if needed (API didn't filter properly)
          if (location && this.shouldPerformClientSideFiltering(this.jobs, location)) {
            this.filterJobsByLocation();
          }
        } else {
          this.noResultsFound = true;
          this.errorMessage = response.error || 'No jobs found matching your skills. Try using the search form with different keywords.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Job search error:', error);
        this.errorMessage = 'Error searching for jobs: ' + (error.message || 'Unknown error');
        this.noResultsFound = true;
        this.isLoading = false;
      }
    });
  }
  
  // Helper method to filter jobs by location
  filterJobsByLocation(): void {
    console.log('Filtering jobs by location:', this.searchLocation);
    const locationLower = this.searchLocation.toLowerCase().trim();
    
    // Apply client-side location filtering with more flexible matching
    const filteredJobs = this.jobs.filter(job => {
      // If no location is specified for the job, include it in results
      if (!job.location) return true;
      
      const jobLocation = job.location.toLowerCase();
      
      // More flexible location matching - check if any part matches
      // For example, "New York" should match "New York, USA"
      return jobLocation.includes(locationLower) || 
             locationLower.includes(jobLocation) ||
             // Check for partial matches (e.g., "York" in "New York")
             locationLower.split(' ').some(part => jobLocation.includes(part)) ||
             jobLocation.split(' ').some(part => locationLower.includes(part));
    });
    
    // Only update jobs if we found some matching the location
    if (filteredJobs.length > 0) {
      console.log(`Found ${filteredJobs.length} jobs matching location ${this.searchLocation}`);
      this.jobs = filteredJobs;
    } else {
      console.log('No jobs found matching the specified location after filtering');
      this.noResultsFound = true;
      this.errorMessage = `No jobs found in ${this.searchLocation} matching your skills. Try a different location.`;
    }
  }

  // Helper method to determine if client-side filtering is needed
  shouldPerformClientSideFiltering(jobs: Job[], location: string): boolean {
    // Check if the API has already filtered by location
    if (!location || location.trim() === '') return false;
    
    const locationLower = location.toLowerCase().trim();
    
    // Count jobs that don't appear to match the location
    let matchCount = 0;
    
    for (const job of jobs) {
      if (!job.location) continue;
      
      const jobLocation = job.location.toLowerCase();
      
      // More flexible location matching
      if (jobLocation.includes(locationLower) || 
          locationLower.includes(jobLocation) ||
          locationLower.split(' ').some(part => jobLocation.includes(part)) ||
          jobLocation.split(' ').some(part => locationLower.includes(part))) {
        matchCount++;
      }
    }
    
    // If less than 30% of jobs match the location, we should filter
    return (matchCount / jobs.length) < 0.3;
  }

  // Save job to localStorage for the Saved Jobs component
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

  viewJobSkills(job: Job): void {
    // Store the job details in localStorage for the job skills component
    const existingAnalysis = localStorage.getItem('recentAnalysis') || '{}';
    const analysisData = JSON.parse(existingAnalysis);
    
    // Update or add the recommendedJobs array with this job
    if (!analysisData.recommendedJobs) {
      analysisData.recommendedJobs = [];
    }
    
    // Add this job if it's not already in the array
    if (!analysisData.recommendedJobs.find((j: Job) => j.id === job.id)) {
      analysisData.recommendedJobs.push(job);
    }
    
    localStorage.setItem('recentAnalysis', JSON.stringify(analysisData));
    
    // Navigate to job skills view
    this.router.navigate(['/job-skills', job.id]);
  }
}
