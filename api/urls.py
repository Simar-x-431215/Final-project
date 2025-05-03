from django.urls import path
from .views import (
    ResumeUploadView, RecommendJobsView, RecommendSkillsView,
    RecommendCoursesView, JobApplicationLinksView, FetchJobsView,
    SaveJobView, SavedJobsView, DeleteSavedJobView,
    CvTemplateListView, CvTemplateDownloadView,
    IntegratedWorkflowView, SkillGapsView, 
    CourseRecommendationsForSkillGapsView, UserSessionView
)

urlpatterns = [
    # Resume upload and processing
    path('resume/upload/', ResumeUploadView.as_view(), name='resume-upload'),
    
    # Job recommendations
    path('jobs/recommend/', RecommendJobsView.as_view(), name='job-recommendations'),
    
    # Skill recommendations
    path('skills/recommend/', RecommendSkillsView.as_view(), name='skill-recommendations'),
    
    # Course recommendations
    path('courses/recommend/', RecommendCoursesView.as_view(), name='course-recommendations'),
    
    # Job application links
    path('jobs/links/', JobApplicationLinksView.as_view(), name='job-application-links'),
    
    # External job search
    path('jobs/search/', FetchJobsView.as_view(), name='fetch-jobs'),
    
    # Saved jobs management
    path('jobs/save/', SaveJobView.as_view(), name='save-job'),
    path('jobs/saved/', SavedJobsView.as_view(), name='saved-jobs'),
    path('jobs/saved/<int:job_id>/', DeleteSavedJobView.as_view(), name='delete-saved-job'),
    
    # CV templates
    path('cv-templates/', CvTemplateListView.as_view(), name='cv-templates-list'),
    path('cv-templates/download/<str:file_name>/', CvTemplateDownloadView.as_view(), name='cv-template-download'),
    
    # Integrated workflow
    path('workflow/integrated/', IntegratedWorkflowView.as_view(), name='integrated-workflow'),
    
    # Skill gaps
    path('skills/gaps/', SkillGapsView.as_view(), name='skill-gaps'),
    
    # Course recommendations for skill gaps
    path('courses/for-skill-gaps/', CourseRecommendationsForSkillGapsView.as_view(), name='courses-for-skill-gaps'),
    
    # User sessions
    path('sessions/', UserSessionView.as_view(), name='user-sessions'),
    path('sessions/<str:session_id>/', UserSessionView.as_view(), name='user-session-detail'),
]