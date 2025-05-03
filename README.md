# Job Recommender API

A Django REST API backend for the Job Recommender application. This API provides endpoints for resume parsing, skill extraction, job recommendations, and more.

## Features

- Resume parsing and skill extraction
- Job recommendations based on skills
- Skill recommendations based on job market
- Course recommendations from Coursera
- Job application links
- External job search API integration
- Saved jobs management

## Prerequisites

- Python 3.7+
- pip
- spaCy model located in `output2` directory
- `Job_listings.csv` file containing job data

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Make sure the spaCy model and CSV file are available in the project root

## Running the Server

You can use the provided script to set up and run the server:

```bash
python run_server.py
```

Or perform the steps manually:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

The server will start at http://localhost:8000

## API Endpoints

### Resume Upload
- **URL**: `/api/resume/upload/`
- **Method**: POST
- **Body**: Form data with 'file' field (PDF)
- **Response**: Extracted skills

### Job Recommendations
- **URL**: `/api/jobs/recommend/`
- **Method**: POST
- **Body**: JSON with 'skills' field (comma-separated list)
- **Response**: List of recommended jobs

### Skill Recommendations
- **URL**: `/api/skills/recommend/`
- **Method**: POST
- **Body**: JSON with 'skills' field (comma-separated list)
- **Response**: List of recommended skills to acquire

### Course Recommendations
- **URL**: `/api/courses/recommend/`
- **Method**: POST
- **Body**: JSON with 'job_title' field
- **Response**: List of related Coursera courses

### Job Application Links
- **URL**: `/api/jobs/links/`
- **Method**: POST
- **Body**: JSON with 'job_id' field
- **Response**: Application links for the job

### External Job Search
- **URL**: `/api/jobs/search/`
- **Method**: POST
- **Body**: JSON with 'query', 'location', 'remote_only', 'employment_types' fields
- **Response**: List of jobs from external API

### Save Job
- **URL**: `/api/jobs/save/`
- **Method**: POST
- **Body**: Job details (id, title, company, etc.)
- **Response**: Saved job details

### Get Saved Jobs
- **URL**: `/api/jobs/saved/`
- **Method**: GET
- **Response**: List of all saved jobs

### Delete Saved Job
- **URL**: `/api/jobs/saved/{job_id}/`
- **Method**: DELETE
- **Response**: Success message

## Integration with Angular

To integrate with your Angular frontend:

1. Enable CORS (already enabled in settings)
2. Make HTTP requests to the API endpoints
3. Example Angular service:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/resume/upload/`, formData);
  }

  getJobRecommendations(skills: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/recommend/`, { skills });
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

  searchJobs(query: string, location: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/search/`, { 
      query, 
      location 
    });
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
} 