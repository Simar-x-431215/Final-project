import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IntegratedWorkflowService } from '../../services/integrated-workflow.service';
import { ResumeService } from '../../services/resume.service';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-cv-analysis',
  templateUrl: './cv-analysis.component.html',
  styleUrls: ['./cv-analysis.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CvAnalysisComponent implements OnInit {
  resumeId: number | null = null;
  loading = false;
  error: string | null = null;
  
  // Results from integrated workflow
  extractedSkills: string[] = [];
  jobRecommendations: any[] = [];
  skillGaps: any[] = [];
  courseRecommendations: any = {};
  
  // Selected job for skill gap analysis
  selectedJob: any = null;
  
  // UI state
  activeStep = 1;
  workflowCompleted = false;
  stepsCompleted: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private workflowService: IntegratedWorkflowService,
    private resumeService: ResumeService,
    private jobService: JobService
  ) { }

  ngOnInit(): void {
    // Get resume ID from route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.resumeId = +params['id'];
        this.runIntegratedWorkflow();
      }
    });
  }

  runIntegratedWorkflow(): void {
    if (!this.resumeId) return;
    
    this.loading = true;
    this.error = null;
    
    this.workflowService.runIntegratedWorkflow(this.resumeId)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.extractedSkills = response.extracted_skills || [];
            this.jobRecommendations = response.job_recommendations || [];
            this.skillGaps = response.skill_gaps || [];
            this.courseRecommendations = response.course_recommendations || {};
            this.stepsCompleted = response.steps_completed || [];
            
            // Set active step based on completed steps
            if (this.stepsCompleted.includes('course_recommendations')) {
              this.activeStep = 4;
              this.workflowCompleted = true;
            } else if (this.stepsCompleted.includes('skill_gaps')) {
              this.activeStep = 3;
            } else if (this.stepsCompleted.includes('job_recommendations')) {
              this.activeStep = 2;
            } else {
              this.activeStep = 1;
            }
            
            // If we have job recommendations but no selected job, select the first one
            if (this.jobRecommendations.length > 0 && !this.selectedJob) {
              this.selectJob(this.jobRecommendations[0]);
            }
          } else {
            this.error = response.error || 'Failed to run integrated workflow';
          }
          this.loading = false;
        },
        (error: any) => {
          this.error = 'An error occurred while running the integrated workflow';
          this.loading = false;
          console.error('Error running integrated workflow:', error);
        }
      );
  }

  selectJob(job: any): void {
    this.selectedJob = job;
    
    // If we already have skill gaps, no need to fetch them again
    if (this.skillGaps.length > 0) {
      this.activeStep = 3;
      return;
    }
    
    // Get skill gaps for the selected job
    if (this.resumeId && this.extractedSkills.length > 0) {
      this.loading = true;
      
      this.workflowService.identifySkillGaps(
        this.extractedSkills.join(', '), 
        job.title, 
        job.description,
        this.resumeId
      ).subscribe(
        (response: any) => {
          if (response.success) {
            this.skillGaps = response.skill_gaps || [];
            this.activeStep = 3;
            
            // If we don't have course recommendations yet, get them
            if (Object.keys(this.courseRecommendations).length === 0 && this.skillGaps.length > 0) {
              this.getCourseRecommendations();
            }
          } else {
            this.error = response.error || 'Failed to identify skill gaps';
          }
          this.loading = false;
        },
        (error: any) => {
          this.error = 'An error occurred while identifying skill gaps';
          this.loading = false;
          console.error('Error identifying skill gaps:', error);
        }
      );
    }
  }

  getCourseRecommendations(): void {
    if (!this.resumeId || this.skillGaps.length === 0) return;
    
    this.loading = true;
    
    this.workflowService.getCourseRecommendationsForSkillGaps(this.skillGaps, this.resumeId)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.courseRecommendations = response.courses_by_skill || {};
            this.activeStep = 4;
            this.workflowCompleted = true;
          } else {
            this.error = response.error || 'Failed to get course recommendations';
          }
          this.loading = false;
        },
        (error: any) => {
          this.error = 'An error occurred while getting course recommendations';
          this.loading = false;
          console.error('Error getting course recommendations:', error);
        }
      );
  }

  saveJob(job: any): void {
    this.jobService.saveJob(job).subscribe(
      (response: any) => {
        // Mark job as saved
        job.saved = true;
      },
      (error: any) => {
        console.error('Error saving job:', error);
      }
    );
  }

  getSkillsForCourses(): string[] {
    return Object.keys(this.courseRecommendations);
  }

  goToStep(step: number): void {
    if (step <= this.activeStep) {
      this.activeStep = step;
    }
  }
}
