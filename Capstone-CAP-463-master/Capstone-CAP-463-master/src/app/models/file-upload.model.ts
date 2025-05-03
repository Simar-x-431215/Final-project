export class FileUpload {
  id: string = '';
  name: string = '';
  url: string = '';
  file: File;
  createdAt: string = '';
  
  constructor(file: File) {
    this.file = file;
    this.name = file.name;
  }
}

export interface ResumeUploadResponse {
  success: boolean;
  id?: string;
  resume_id?: number;
  skills?: string[];
  skills_text?: string;
  error?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  similarity_score?: number;
  description: string;
  location: string;
  posted_date?: string;
  salary?: string;
  job_type?: string;
  url?: string;
  skills?: string[];
}

export interface JobRecommendationResponse {
  success: boolean;
  jobs: Job[];
  error?: string;
}

export interface SkillRecommendationResponse {
  success: boolean;
  recommended_skills: string[];
  error?: string;
}

export interface CourseRecommendationResponse {
  success: boolean;
  courses: {
    name: string;
    url: string;
  }[];
  error?: string;
} 