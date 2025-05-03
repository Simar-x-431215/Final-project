import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CvAnalysis, ImprovementArea, Keyword } from '../models/cv-analysis.model';
import { JobRecommenderService } from './job-recommender.service';

@Injectable({
  providedIn: 'root'
})
export class CvAnalysisService {
  constructor(private jobRecommenderService: JobRecommenderService) { }

  // Process resume using Django backend
  analyzeResume(file: File): Observable<any> {
    return this.jobRecommenderService.uploadResume(file);
  }

  // Get job recommendations based on skills
  getJobRecommendations(skills: string): Observable<any> {
    return this.jobRecommenderService.getJobRecommendations(skills);
  }

  // Get skill recommendations
  getSkillRecommendations(skills: string, skillCount: number = 10): Observable<any> {
    return this.jobRecommenderService.getSkillRecommendations(skills);
  }

  // Get course recommendations
  getCourseRecommendations(jobTitle: string): Observable<any> {
    return this.jobRecommenderService.getCourseRecommendations(jobTitle);
  }

  // For UI purposes - generate a CV analysis from extracted skills
  generateAnalysisFromSkills(skills: string[]): CvAnalysis {
    const fileId = 'generated-' + new Date().getTime();
    
    // Create skill keywords from extracted skills
    const keywords: Keyword[] = skills.map(skill => ({
      text: skill,
      isPresent: true
    }));
    
    // Add some common missing skills
    const commonSkills = ['Machine Learning', 'Cloud Computing', 'DevOps', 'Agile Methodology'];
    commonSkills.forEach(skill => {
      if (!skills.includes(skill)) {
        keywords.push({
          text: skill,
          isPresent: false
        });
      }
    });
    
    const improvementAreas: ImprovementArea[] = [
      {
        name: 'Skills Section',
        score: 65,
        status: 'Needs Attention',
        statusClass: 'warning',
        recommendation: 'Consider adding more specific technical skills that match your target roles.'
      },
      {
        name: 'Work Experience',
        score: 85,
        status: 'Very Good',
        statusClass: 'success',
        recommendation: 'Your experience section is strong, but try quantifying achievements with more metrics.'
      },
      {
        name: 'Education',
        score: 90,
        status: 'Excellent',
        statusClass: 'success',
        recommendation: 'Education section is well-formatted and complete.'
      },
      {
        name: 'ATS Compatibility',
        score: 45,
        status: 'Needs Improvement',
        statusClass: 'danger',
        recommendation: 'Your CV may not pass through Applicant Tracking Systems. Consider using industry-standard formats.'
      }
    ];

    const recommendations: string[] = [
      'Enhance Skills Section: Add specific technical skills relevant to your target roles.',
      'Quantify Achievements: Include metrics and quantifiable results for your work experience.',
      'ATS Optimization: Use a simpler format and include more industry-specific keywords.',
      'Expand Project Details: Provide more context about your key projects and your specific role.',
      'Add a Professional Summary: Begin your CV with a concise professional summary highlighting your strengths.'
    ];

    return {
      fileId,
      overallScore: 75,
      improvementAreas,
      keywords,
      recommendations
    };
  }
} 