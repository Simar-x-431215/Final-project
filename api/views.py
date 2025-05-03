from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os
import json
from django.http import FileResponse
import mimetypes

from .models import UserResume, SavedJob, CvTemplate, SkillGap, CourseRecommendation, UserSession
from .serializers import (
    UserResumeSerializer, SavedJobSerializer, 
    ResumeUploadSerializer, SkillsInputSerializer, 
    JobTitleInputSerializer, JobIdInputSerializer,
    JobSearchInputSerializer, CvTemplateSerializer,
    SkillGapSerializer, CourseRecommendationSerializer,
    UserSessionSerializer, IntegratedWorkflowInputSerializer,
    SkillsWithProficiencySerializer
)
from .utils import (
    process_resume, get_job_recommendations,
    get_skill_recommendations, get_course_recommendations,
    get_application_links, fetch_jobs_api,
    identify_skill_gaps, get_skill_gap_courses,
    integrated_workflow
)

class ResumeUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        serializer = ResumeUploadSerializer(data=request.data)
        
        if serializer.is_valid():
            resume_file = serializer.validated_data['file']
            
            # Save uploaded file
            user_resume = UserResume(file=resume_file)
            user_resume.save()
            
            # Process the resume
            file_path = os.path.join(settings.MEDIA_ROOT, str(user_resume.file))
            result = process_resume(file_path)
            
            if result['success']:
                # Update UserResume with extracted skills
                user_resume.extracted_skills = result['skills_text']
                user_resume.save()
                
                # Return the response
                return Response({
                    'success': True,
                    'resume_id': user_resume.id,
                    'skills': result['skills'],
                    'skills_text': result['skills_text']
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecommendJobsView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SkillsInputSerializer(data=request.data)
        
        if serializer.is_valid():
            skills_text = serializer.validated_data['skills']
            result = get_job_recommendations(skills_text)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecommendSkillsView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SkillsInputSerializer(data=request.data)
        
        if serializer.is_valid():
            skills_text = serializer.validated_data['skills']
            skill_count = request.data.get('skill_count', 10)
            
            result = get_skill_recommendations(skills_text, int(skill_count))
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecommendCoursesView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = JobTitleInputSerializer(data=request.data)
        
        if serializer.is_valid():
            job_title = serializer.validated_data['job_title']
            result = get_course_recommendations(job_title)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobApplicationLinksView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = JobIdInputSerializer(data=request.data)
        
        if serializer.is_valid():
            job_id = serializer.validated_data['job_id']
            result = get_application_links(job_id)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FetchJobsView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = JobSearchInputSerializer(data=request.data)
        
        if serializer.is_valid():
            query = serializer.validated_data.get('query', '')
            location = serializer.validated_data.get('location', 'India')
            remote = 'true' if serializer.validated_data.get('remote_only', False) else 'false'
            employment_types = serializer.validated_data.get('employment_types', 'fulltime;parttime;intern;contractor')
            
            result = fetch_jobs_api(
                query=query,
                location=location,
                remote=remote,
                employment_types=employment_types
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SaveJobView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SavedJobSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Job saved successfully',
                'job': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SavedJobsView(APIView):
    def get(self, request, *args, **kwargs):
        saved_jobs = SavedJob.objects.all().order_by('-saved_at')
        serializer = SavedJobSerializer(saved_jobs, many=True)
        
        return Response({
            'success': True,
            'jobs': serializer.data
        }, status=status.HTTP_200_OK)

class DeleteSavedJobView(APIView):
    def delete(self, request, job_id, *args, **kwargs):
        try:
            saved_job = SavedJob.objects.get(id=job_id)
            saved_job.delete()
            
            return Response({
                'success': True,
                'message': 'Job deleted successfully'
            }, status=status.HTTP_200_OK)
        except SavedJob.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Job not found'
            }, status=status.HTTP_404_NOT_FOUND)

class CvTemplateListView(APIView):
    """View to list all CV templates"""
    def get(self, request, *args, **kwargs):
        # Get category filter if provided
        category = request.query_params.get('category', None)
        
        # Get all templates from the database
        if CvTemplate.objects.count() == 0:
            # If no templates in database, initialize with default templates
            self.initialize_cv_templates()
            
        if category and category.lower() != 'all':
            templates = CvTemplate.objects.filter(category=category)
        else:
            templates = CvTemplate.objects.all()
            
        serializer = CvTemplateSerializer(templates, many=True)
        
        return Response({
            'success': True,
            'templates': serializer.data
        }, status=status.HTTP_200_OK)
    
    def initialize_cv_templates(self):
        """Initialize CV templates in the database"""
        templates_data = [
            {
                'name': 'Classic Management',
                'file_name': 'Classic management resume.docx',
                'description': 'Professional template for management positions with a classic design.',
                'category': 'Business'
            },
            {
                'name': 'Swiss Design',
                'file_name': 'Swiss design resume.docx',
                'description': 'Clean, minimalist design with Swiss typography principles.',
                'category': 'Creative'
            },
            {
                'name': 'Attorney Resume',
                'file_name': 'Attorney resume.docx',
                'description': 'Professional template for legal practitioners.',
                'category': 'Legal'
            },
            {
                'name': 'Bold Attorney',
                'file_name': 'Bold attorney resume.docx',
                'description': 'Stand out with this bold design for legal professionals.',
                'category': 'Legal'
            },
            {
                'name': 'Creative Teaching',
                'file_name': 'Creative teaching resume.docx',
                'description': 'Eye-catching template for educators with a creative flair.',
                'category': 'Teaching'
            },
            {
                'name': 'Stylish Teaching',
                'file_name': 'Stylish teaching resume.docx',
                'description': 'Modern design for educators focused on visual presentation.',
                'category': 'Teaching'
            },
            {
                'name': 'Geometric Resume',
                'file_name': 'Geometric resume.docx',
                'description': 'Geometric patterns add visual interest to this modern template.',
                'category': 'Creative'
            },
            {
                'name': 'Modern Nursing',
                'file_name': 'Modern nursing resume.docx',
                'description': 'Clean template designed for healthcare professionals.',
                'category': 'Medical'
            },
            {
                'name': 'Paralegal Resume',
                'file_name': 'Paralegal resume.docx',
                'description': 'Professional template for paralegal and legal support roles.',
                'category': 'Legal'
            },
            {
                'name': 'Playful Business',
                'file_name': 'Playful business resume.docx',
                'description': 'Business resume with a playful twist for creative industries.',
                'category': 'Business'
            },
            {
                'name': 'Social Media Marketing',
                'file_name': 'Social media marketing resume.docx',
                'description': 'Designed for digital marketers and social media professionals.',
                'category': 'Business'
            },
            {
                'name': 'Stylish Sales',
                'file_name': 'Stylish sales resume.docx',
                'description': 'Eye-catching template to showcase your sales achievements.',
                'category': 'Sales'
            },
            {
                'name': 'Modern Bold Sales',
                'file_name': 'Modern bold sales resume.docx',
                'description': 'Bold design that helps sales professionals stand out.',
                'category': 'Sales'
            },
            {
                'name': 'ATS Bold Accounting',
                'file_name': 'ATS Bold accounting resume.docx',
                'description': 'ATS-friendly template for accounting professionals.',
                'category': 'Business'
            },
            {
                'name': 'Modern Hospitality',
                'file_name': 'Modern hospitality resume.docx',
                'description': 'Clean design for hospitality industry professionals.',
                'category': 'Business'
            },
            {
                'name': 'ATS Classic HR',
                'file_name': 'ATS classic HR resume.docx',
                'description': 'ATS-optimized template for human resources professionals.',
                'category': 'Business'
            },
            {
                'name': 'Color Block Resume',
                'file_name': 'Color block resume.docx',
                'description': 'Vibrant template with color blocks for creative professionals.',
                'category': 'Creative'
            },
            {
                'name': 'Industry Manager Resume',
                'file_name': 'Industry manager resume.docx',
                'description': 'Specialized template for industry and manufacturing managers.',
                'category': 'Business'
            },
            {
                'name': 'Cover Letter (Referred)',
                'file_name': 'Resume cover letter when referred.docx',
                'description': 'Cover letter template for when you have been referred by someone.',
                'category': 'Other'
            },
            {
                'name': 'Cover Letter (Temporary)',
                'file_name': 'Resume cover letter for temporary position.docx',
                'description': 'Cover letter template for temporary or contract positions.',
                'category': 'Other'
            }
        ]
        
        for template_data in templates_data:
            CvTemplate.objects.create(**template_data)


class CvTemplateDownloadView(APIView):
    """View to download a CV template"""
    def get(self, request, file_name, *args, **kwargs):
        try:
            # Construct the file path
            file_path = os.path.join(settings.MEDIA_ROOT, 'cv_templates', file_name)
            
            # Check if file exists
            if not os.path.exists(file_path):
                return Response({
                    'success': False,
                    'error': 'Template file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Set the correct MIME type for Word documents
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            
            # Return the file
            response = FileResponse(open(file_path, 'rb'), content_type=mime_type)
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'
            
            return response
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IntegratedWorkflowView(APIView):
    """View for the integrated workflow from resume upload to course recommendations"""
    def post(self, request, *args, **kwargs):
        serializer = IntegratedWorkflowInputSerializer(data=request.data)
        
        if serializer.is_valid():
            # Get input parameters
            resume_id = serializer.validated_data.get('resume_id')
            session_id = serializer.validated_data.get('session_id')
            job_title = serializer.validated_data.get('job_title')
            location = serializer.validated_data.get('location')
            remote_only = serializer.validated_data.get('remote_only', False)
            
            # If session_id is provided, try to get resume_id from session
            if session_id and not resume_id:
                try:
                    session = UserSession.objects.get(session_id=session_id)
                    if session.resume:
                        resume_id = session.resume.id
                except UserSession.DoesNotExist:
                    pass
            
            # Run the integrated workflow
            result = integrated_workflow(
                resume_id=resume_id,
                user_skills_text=None,  # We'll get this from the resume
                job_title=job_title,
                location=location,
                remote_only=remote_only
            )
            
            # If successful and we have a session_id but no session, create one
            if result['success'] and session_id and resume_id:
                session, created = UserSession.objects.get_or_create(
                    session_id=session_id,
                    defaults={'resume_id': resume_id}
                )
                if not created and not session.resume:
                    session.resume_id = resume_id
                    session.save()
            
            return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SkillGapsView(APIView):
    """View to identify skill gaps based on user skills and job requirements"""
    def post(self, request, *args, **kwargs):
        # Validate input
        skills_serializer = SkillsInputSerializer(data=request.data)
        
        if skills_serializer.is_valid():
            skills_text = skills_serializer.validated_data['skills']
            job_title = request.data.get('job_title', '')
            job_description = request.data.get('job_description', '')
            
            # Identify skill gaps
            result = identify_skill_gaps(skills_text, job_title, job_description)
            
            # If successful and resume_id is provided, save skill gaps to database
            if result['success'] and 'resume_id' in request.data:
                try:
                    resume = UserResume.objects.get(id=request.data['resume_id'])
                    
                    # Save skill gaps to database
                    for skill_gap_data in result['skill_gaps']:
                        skill_gap = SkillGap.objects.create(
                            resume=resume,
                            skill=skill_gap_data['skill'],
                            job_title=skill_gap_data['job_title'],
                            importance=skill_gap_data['importance']
                        )
                        skill_gap_data['id'] = skill_gap.id
                except UserResume.DoesNotExist:
                    pass
            
            return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)
        
        return Response(skills_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CourseRecommendationsForSkillGapsView(APIView):
    """View to get course recommendations for skill gaps"""
    def post(self, request, *args, **kwargs):
        # Get skill gaps from request
        skill_gaps = request.data.get('skill_gaps', [])
        
        if not skill_gaps:
            return Response({
                'success': False,
                'error': 'No skill gaps provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get course recommendations
        result = get_skill_gap_courses(skill_gaps)
        
        # If successful and resume_id is provided, save course recommendations to database
        if result['success'] and 'resume_id' in request.data:
            try:
                resume = UserResume.objects.get(id=request.data['resume_id'])
                
                # Save course recommendations to database
                for skill, courses in result['courses_by_skill'].items():
                    # Find skill gap for this skill
                    skill_gaps_for_skill = SkillGap.objects.filter(
                        resume=resume,
                        skill=skill
                    )
                    
                    if skill_gaps_for_skill.exists():
                        skill_gap = skill_gaps_for_skill.first()
                        
                        # Save course recommendations
                        for course_data in courses:
                            CourseRecommendation.objects.create(
                                skill_gap=skill_gap,
                                course_name=course_data['course_name'],
                                course_url=course_data['course_url'],
                                platform=course_data['platform']
                            )
            except UserResume.DoesNotExist:
                pass
        
        return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)

class UserSessionView(APIView):
    """View to manage user sessions"""
    def post(self, request, *args, **kwargs):
        serializer = UserSessionSerializer(data=request.data)
        
        if serializer.is_valid():
            session = serializer.save()
            
            return Response({
                'success': True,
                'session': UserSessionSerializer(session).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, session_id, *args, **kwargs):
        try:
            session = UserSession.objects.get(session_id=session_id)
            
            # Update last activity
            session.save()  # This will update the auto_now field
            
            return Response({
                'success': True,
                'session': UserSessionSerializer(session).data
            }, status=status.HTTP_200_OK)
        except UserSession.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
