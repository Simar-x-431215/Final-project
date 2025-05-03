import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Upload a resume file
   */
  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/resume/upload/`, formData);
  }

  /**
   * Get a specific resume by ID
   */
  getResume(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/resume/${id}/`);
  }

  /**
   * Get all resumes
   */
  getResumes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumes/`);
  }
}
