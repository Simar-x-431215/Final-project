import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FileUpload } from '../models/file-upload.model';
import { JobRecommenderService } from './job-recommender.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  // Local storage of files for session
  private uploadedFiles: FileUpload[] = [];

  constructor(private jobRecommenderService: JobRecommenderService) { }

  // Upload a file to Django backend
  uploadFile(fileUpload: FileUpload): Observable<any> {
    // Set file metadata in local memory
    fileUpload.id = 'file_' + new Date().getTime();
    fileUpload.createdAt = new Date().toISOString();
    
    // Add to local list
    this.uploadedFiles.push(fileUpload);
    
    // Upload to Django backend
    return this.jobRecommenderService.uploadResume(fileUpload.file);
  }

  // Get files from local memory
  getFiles(limit: number = 10): Observable<FileUpload[]> {
    // Return files sorted by created date (newest first)
    const sortedFiles = [...this.uploadedFiles]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
      
    return of(sortedFiles);
  }

  // Delete a file
  deleteFile(fileId: string): Observable<boolean> {
    // Remove file from local memory
    const initialLength = this.uploadedFiles.length;
    this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
    
    // Return success/failure
    return of(initialLength > this.uploadedFiles.length);
  }
} 