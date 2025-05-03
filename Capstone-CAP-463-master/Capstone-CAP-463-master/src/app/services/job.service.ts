import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Search for jobs using the external API
   */
  searchJobs(query: string, location: string = 'India', remote: boolean = false): Observable<any> {
    const remoteStr = remote ? 'true' : 'false';
    return this.http.post(`${this.apiUrl}/jobs/search/`, {
      query,
      location,
      remote: remoteStr
    });
  }

  /**
   * Get job recommendations based on skills
   */
  getJobRecommendations(skills: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/recommend/`, {
      skills
    });
  }

  /**
   * Save a job to the user's saved jobs
   */
  saveJob(job: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/save/`, job);
  }

  /**
   * Get all saved jobs
   */
  getSavedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs/saved/`);
  }

  /**
   * Delete a saved job
   */
  deleteSavedJob(jobId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobs/saved/${jobId}/`);
  }
}
