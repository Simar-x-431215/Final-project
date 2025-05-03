import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class IntegratedWorkflowService {
  private apiUrl = environment.apiUrl;
  private sessionId: string;

  constructor(private http: HttpClient) {
    // Initialize or retrieve session ID from local storage
    this.sessionId = localStorage.getItem('sessionId') || this.generateSessionId();
  }

  private generateSessionId(): string {
    const sessionId = uuidv4();
    localStorage.setItem('sessionId', sessionId);
    return sessionId;
  }

  /**
   * Run the integrated workflow from resume upload to course recommendations
   */
  runIntegratedWorkflow(resumeId: number, jobTitle?: string, location?: string, remoteOnly?: boolean): Observable<any> {
    const payload = {
      session_id: this.sessionId,
      resume_id: resumeId,
      job_title: jobTitle,
      location: location,
      remote_only: remoteOnly
    };

    return this.http.post(`${this.apiUrl}/workflow/integrated/`, payload);
  }

  /**
   * Identify skill gaps based on user skills and job requirements
   */
  identifySkillGaps(skills: string, jobTitle: string, jobDescription?: string, resumeId?: number): Observable<any> {
    const payload: any = {
      skills: skills,
      job_title: jobTitle,
      job_description: jobDescription
    };

    if (resumeId) {
      payload.resume_id = resumeId;
    }

    return this.http.post(`${this.apiUrl}/skills/gaps/`, payload);
  }

  /**
   * Get course recommendations for skill gaps
   */
  getCourseRecommendationsForSkillGaps(skillGaps: any[], resumeId?: number): Observable<any> {
    const payload: any = {
      skill_gaps: skillGaps
    };

    if (resumeId) {
      payload.resume_id = resumeId;
    }

    return this.http.post(`${this.apiUrl}/courses/for-skill-gaps/`, payload);
  }

  /**
   * Get user session by ID
   */
  getUserSession(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions/${this.sessionId}/`);
  }

  /**
   * Create or update user session
   */
  createUserSession(resumeId?: number): Observable<any> {
    const payload: any = {
      session_id: this.sessionId
    };

    if (resumeId) {
      payload.resume = resumeId;
    }

    return this.http.post(`${this.apiUrl}/sessions/`, payload);
  }

  /**
   * Complete integrated workflow with step-by-step approach
   * This function follows the exact flow requested:
   * 1. CV Upload (handled by file-upload.service.ts)
   * 2. Skill extraction (from resume)
   * 3. Job recommendations based on skills
   * 4. Skill gaps identification
   * 5. Course recommendations for skill gaps
   */
  completeWorkflow(resumeId: number): Observable<any> {
    // Create a session with the resume ID
    return this.createUserSession(resumeId).pipe(
      switchMap(sessionResponse => {
        if (!sessionResponse.success) {
          return throwError(() => new Error('Failed to create session'));
        }
        
        // Run the integrated workflow
        return this.runIntegratedWorkflow(resumeId);
      }),
      catchError(error => {
        console.error('Workflow error:', error);
        return throwError(() => new Error('Failed to complete workflow: ' + error.message));
      })
    );
  }
}
