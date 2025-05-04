import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, delay, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JobRecommenderService {
  private apiUrl = 'http://localhost:8000/api';
  
  // RapidAPI configuration for JSearch API
  private rapidApiUrl = 'https://jsearch.p.rapidapi.com/search';
  private rapidApiKey = '270fcf7be8msh5fdf506d3962e07p121c1ejsnffafc65db012';
  private rapidApiHost = 'jsearch.p.rapidapi.com';

  // Alternative API for skills-based search
  private skillsApiUrl = 'https://api.adzuna.com/v1/api/jobs';
  private skillsApiAppId = 'YOUR_APP_ID'; // You'll need to replace this
  private skillsApiKey = 'YOUR_API_KEY'; // You'll need to replace this

  // New API for skills-based search from RapidAPI
  private apijobUrl = 'https://apijob-job-searching-api.p.rapidapi.com/search';
  private apijobHost = 'apijob-job-searching-api.p.rapidapi.com';
  // Use the same key for now - you can replace with a different one if needed
  private apijobKey = '270fcf7be8msh5fdf506d3962e07p121c1ejsnffafc65db012';

  constructor(private http: HttpClient) { }

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/resume/upload/`, formData);
  }

  getJobRecommendations(skills: string): Observable<any> {
    console.log('Getting job recommendations for skills:', skills);
    
    if (!skills || skills.trim() === '') {
      console.error('No skills provided for job recommendations');
      return of({
        success: false,
        error: 'No skills provided for job recommendations',
        jobs: []
      });
    }
    
    // Split the skills string into an array and search for jobs
    const skillsArray = skills.split(',').map(skill => skill.trim());
    return this.searchJobsBySkills(skillsArray);
  }

  getSkillRecommendations(skills: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/skills/recommend/`, { skills });
  }

  getCourseRecommendations(jobTitle: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/recommend/`, { job_title: jobTitle });
  }

  getJobLinks(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/links/`, { job_id: jobId });
  }

  // Method 1: Search jobs based on extracted skills only (for resume analysis)
  searchJobsBySkills(skills: string[], location?: string): Observable<any> {
    console.log('Searching jobs by skills:', skills);
    
    // Ensure we have skills to search with
    if (!skills || skills.length === 0) {
      console.error('No skills provided for job search');
      return of({
        success: false,
        error: 'No skills provided for job search',
        jobs: []
      });
    }
    
    // Group skills by category for more relevant search
    const skillGroups = this.groupSkillsByCategory(skills);
    
    // Create a query that requires at least one skill from each major category
    const queryParts = [];
    
    // Add programming languages and frameworks with OR between them
    if (skillGroups.technical.length > 0) {
      queryParts.push(`(${skillGroups.technical.map(skill => `"${skill.trim()}"`).join(' OR ')})`);
    }
    
    // Add tools and technologies with OR between them
    if (skillGroups.tools.length > 0) {
      queryParts.push(`(${skillGroups.tools.map(skill => `"${skill.trim()}"`).join(' OR ')})`);
    }
    
    // Add soft skills with OR between them
    if (skillGroups.soft.length > 0) {
      queryParts.push(`(${skillGroups.soft.map(skill => `"${skill.trim()}"`).join(' OR ')})`);
    }
    
    // Join all parts with AND to ensure jobs match multiple categories
    const formattedQuery = queryParts.join(' AND ');
    console.log('Using categorized skills for job search:', formattedQuery);
    
    // Call the real-time job search API with the enhanced query
    return this.searchRealTimeJobs({
      query: formattedQuery,
      location: location || 'India',
      page: '1',
      num_pages: '3' // Request 3 pages of results to get more jobs
    });
  }

  private groupSkillsByCategory(skills: string[]): { technical: string[], tools: string[], soft: string[] } {
    const technicalSkills = [
      'javascript', 'python', 'java', 'typescript', 'c++', 'react', 'angular', 
      'vue', 'node', 'express', 'django', 'spring', 'php', '.net', 'ruby'
    ];
    
    const toolsAndTech = [
      'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'ci/cd',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'
    ];
    
    const softSkills = [
      'communication', 'leadership', 'teamwork', 'problem solving', 'agile', 
      'scrum', 'project management', 'analytical', 'collaboration'
    ];
    
    const grouped: { technical: string[], tools: string[], soft: string[] } = {
      technical: [],
      tools: [],
      soft: []
    };
    
    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (technicalSkills.some(tech => skillLower.includes(tech))) {
        grouped.technical.push(skill);
      } else if (toolsAndTech.some(tool => skillLower.includes(tool))) {
        grouped.tools.push(skill);
      } else if (softSkills.some(soft => skillLower.includes(soft))) {
        grouped.soft.push(skill);
      } else {
        // If skill doesn't match any category, add it to technical by default
        grouped.technical.push(skill);
      }
    });
    
    return grouped;
  }

  // Method 2: Search jobs with all parameters (for jobs page)
  searchJobs(params: any): Observable<any> {
    console.log('Searching jobs with params:', params);
    
    // If query is empty, return an error
    if (!params.query || params.query.trim() === '') {
      console.error('No query provided for job search');
      return of({
        success: false,
        error: 'Please enter a search term',
        jobs: []
      });
    }
    
    // Use the real-time job search API
    return this.searchRealTimeJobs(params);
  }

  // Core method for real-time job search using RapidAPI
  public searchRealTimeJobs(params: any): Observable<any> {
    console.log('Searching real-time jobs with params:', params);
    
    // Use the JSearch API from RapidAPI
    const rapidApiUrl = 'https://jsearch.p.rapidapi.com/search';
    
    const headers = new HttpHeaders({
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost
    });
    
    // Format the query string to include the location in the query itself
    // This is how JSearch API actually handles location filtering
    let queryString = params.query;
    if (params.location && params.location.trim() !== '') {
      const locationTerm = params.location.trim();
      // Add location to the query string itself, as JSearch works better this way
      queryString = `${queryString} ${locationTerm}`;
      console.log(`Added location to query string: "${queryString}"`);
    }
    
    // Simple params object with the enhanced query
    let apiParams = new HttpParams()
      .set('query', queryString)
      .set('page', params.page || '1')
      .set('num_pages', params.num_pages || '1');
    
    // JSearch doesn't properly use the location parameter for non-US locations
    // Instead we're including it in the query string above
    
    console.log('API request URL:', rapidApiUrl);
    console.log('API params:', apiParams.toString());
    
    // Make the API call
    return this.http.get(rapidApiUrl, {
      headers: headers,
      params: apiParams
    }).pipe(
      map((response: any) => {
        // Transform API response to application format
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log('SUCCESS: Found jobs from API');
          return {
            success: true,
            jobs: response.data.map((job: any) => ({
              id: job.job_id || `job-${Math.random().toString(36).substr(2, 9)}`,
              title: job.job_title || 'Unknown Position',
              company: job.employer_name || 'Unknown Company',
              location: job.job_city ? `${job.job_city}, ${job.job_country}` : (job.job_country || 'Remote'),
              description: job.job_description || 'No description available',
              posted_date: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString() : 'Recent',
              job_type: job.job_employment_type || 'Full-time',
              url: job.job_apply_link || '#',
              salary: job.job_min_salary && job.job_max_salary ? 
                `${job.job_min_salary}-${job.job_max_salary} ${job.job_salary_currency || 'USD'}` : 
                'Not specified',
              skills: job.job_required_skills || []
            }))
          };
        } else {
          console.log('ERROR: No jobs found in API response');
          return {
            success: false,
            jobs: [],
            error: 'No jobs found. Please try refreshing or modifying your search.'
          };
        }
      }),
      catchError(error => {
        console.error('Error fetching jobs from RapidAPI:', error);
        return of({
          success: false,
          jobs: [],
          error: 'Error fetching jobs. Please try refreshing or modifying your search.'
        });
      })
    );
  }

  getRecentJobs(): Observable<any> {
    // Use real-time job search with a generic query
    return this.searchRealTimeJobs({ query: 'developer' });
  }

  saveJob(job: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/save/`, job);
  }

  getSavedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs/saved/`);
  }

  deleteSavedJob(jobId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobs/saved/${jobId}/`);
  }

  // Get job details by ID
  getJobDetails(jobId: string): Observable<any> {
    console.log('Getting job details for ID:', jobId);
    
    // For now, we'll just return a mock response since we don't have a real API endpoint for this
    // In a real application, you would make an HTTP request to get job details
    return of({
      success: true,
      job: {
        id: jobId,
        title: 'Job Title', // This will be overridden if found in localStorage
        company: 'Company Name', // This will be overridden if found in localStorage
        location: 'Location',
        description: 'Job description'
      }
    }).pipe(
      delay(500) // Simulate network delay
    );
  }
  
  // Get required skills for a job
  getJobRequiredSkills(jobId: string): Observable<any> {
    console.log('Getting required skills for job ID:', jobId);
    
    // First, try to get the job from localStorage
    let job: any = null;
    const savedJobsJson = localStorage.getItem('savedJobs');
    if (savedJobsJson) {
      const savedJobs = JSON.parse(savedJobsJson);
      job = savedJobs.find((j: any) => j.id === jobId);
    }
    
    if (!job) {
      const recentAnalysisJson = localStorage.getItem('recentAnalysis');
      if (recentAnalysisJson) {
        const recentAnalysis = JSON.parse(recentAnalysisJson);
        if (recentAnalysis.recommendedJobs) {
          job = recentAnalysis.recommendedJobs.find((j: any) => j.id === jobId);
        }
      }
    }

    if (job) {
      // If we have the job details, extract skills or use existing skills
      if (job.skills && job.skills.length > 0) {
        // Return existing skills if available
        return of({
          success: true,
          skills: job.skills
        });
      } else if (job.job_description || job.description) {
        // Extract skills from job description using backend API
        return this.http.post(`${this.apiUrl}/skills/extract/`, {
          text: job.job_description || job.description
        }).pipe(
          map((response: any) => {
            if (response.success && response.skills) {
              // Cache the skills in the job object
              job.skills = response.skills;
              this.updateJobInStorage(job);
              return {
                success: true,
                skills: response.skills
              };
            }
            throw new Error('Failed to extract skills from job description');
          }),
          catchError(error => {
            console.error('Error extracting skills:', error);
            // Fallback to keyword-based extraction
            return this.extractSkillsFromDescription(job.job_description || job.description);
          })
        );
      }
    }

    // If we don't have the job details, try to fetch them from the API
    return this.getJobDetails(jobId).pipe(
      switchMap((jobResponse: any) => {
        if (jobResponse.success && jobResponse.job) {
          const jobData = jobResponse.job;
          return this.http.post(`${this.apiUrl}/skills/extract/`, {
            text: jobData.description
          }).pipe(
            map((response: any) => ({
              success: true,
              skills: response.skills || this.extractCommonSkills(jobData.description)
            })),
            catchError(() => this.extractSkillsFromDescription(jobData.description))
          );
        }
        return this.provideFallbackSkills();
      }),
      catchError(() => this.provideFallbackSkills())
    );
  }

  private extractSkillsFromDescription(description: string): Observable<any> {
    // Simple keyword-based skill extraction as fallback
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Angular', 'Vue.js',
      'Node.js', 'Express', 'MongoDB', 'SQL', 'REST API', 'Git', 'AWS', 'Azure',
      'Docker', 'Kubernetes', 'CI/CD', 'Agile', 'Scrum', 'Communication'
    ];
    
    const foundSkills = commonSkills.filter(skill => 
      description.toLowerCase().includes(skill.toLowerCase())
    );

    return of({
      success: true,
      skills: foundSkills.length > 0 ? foundSkills : this.extractCommonSkills(description)
    });
  }

  private extractCommonSkills(description: string): string[] {
    // Provide a basic set of skills based on job description keywords
    const techStack = description.toLowerCase().includes('frontend') || description.toLowerCase().includes('front-end') ?
      ['HTML', 'CSS', 'JavaScript', 'React/Angular', 'UI/UX'] :
      description.toLowerCase().includes('backend') || description.toLowerCase().includes('back-end') ?
        ['Node.js', 'Python', 'Databases', 'API Development', 'Server Management'] :
        ['Programming', 'Problem Solving', 'Team Collaboration', 'Communication', 'Project Management'];

    return techStack;
  }

  private provideFallbackSkills(): Observable<any> {
    return of({
      success: true,
      skills: [
        'Programming',
        'Problem Solving',
        'Communication',
        'Team Collaboration',
        'Project Management'
      ]
    });
  }

  private updateJobInStorage(job: any): void {
    // Update job in localStorage if it exists
    const savedJobsJson = localStorage.getItem('savedJobs');
    if (savedJobsJson) {
      const savedJobs = JSON.parse(savedJobsJson);
      const index = savedJobs.findIndex((j: any) => j.id === job.id);
      if (index !== -1) {
        savedJobs[index] = job;
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
      }
    }

    // Update in recentAnalysis if it exists
    const recentAnalysisJson = localStorage.getItem('recentAnalysis');
    if (recentAnalysisJson) {
      const recentAnalysis = JSON.parse(recentAnalysisJson);
      if (recentAnalysis.recommendedJobs) {
        const index = recentAnalysis.recommendedJobs.findIndex((j: any) => j.id === job.id);
        if (index !== -1) {
          recentAnalysis.recommendedJobs[index] = job;
          localStorage.setItem('recentAnalysis', JSON.stringify(recentAnalysis));
        }
      }
    }
  }
}