from rest_framework import serializers
from .models import UserResume, JobSearch, UserSkills, SavedJob, CvTemplate, SkillGap, CourseRecommendation, UserSession

class UserResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserResume
        fields = ['id', 'file', 'uploaded_at', 'extracted_skills']

class JobSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSearch
        fields = ['id', 'query', 'location', 'remote_only', 'employment_types', 'created_at']

class UserSkillsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkills
        fields = ['id', 'resume', 'skill']

class SavedJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedJob
        fields = ['id', 'job_id', 'title', 'company', 'location', 'description', 'saved_at']

# Serializers for request/response data that aren't tied to models

class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

class SkillsInputSerializer(serializers.Serializer):
    skills = serializers.CharField(help_text="Comma-separated list of skills")
    
class JobTitleInputSerializer(serializers.Serializer):
    job_title = serializers.CharField(max_length=255)
    
class JobIdInputSerializer(serializers.Serializer):
    job_id = serializers.CharField(max_length=255)
    
class JobSearchInputSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=255, required=False, allow_blank=True)
    location = serializers.CharField(max_length=255, required=False, default="India")
    remote_only = serializers.BooleanField(required=False, default=False)
    employment_types = serializers.CharField(max_length=255, required=False, 
                                            default="fulltime;parttime;intern;contractor") 

class CvTemplateSerializer(serializers.ModelSerializer):
    """Serializer for CV templates"""
    class Meta:
        model = CvTemplate
        fields = ['id', 'name', 'file_name', 'description', 'category']

class SkillGapSerializer(serializers.ModelSerializer):
    """Serializer for skill gaps"""
    class Meta:
        model = SkillGap
        fields = ['id', 'skill', 'job_title', 'importance', 'created_at']

class CourseRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for course recommendations"""
    class Meta:
        model = CourseRecommendation
        fields = ['id', 'course_name', 'course_url', 'platform', 'created_at']

class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions"""
    class Meta:
        model = UserSession
        fields = ['id', 'session_id', 'resume', 'created_at', 'last_activity']

class IntegratedWorkflowInputSerializer(serializers.Serializer):
    """Serializer for integrated workflow input"""
    session_id = serializers.CharField(required=False)
    resume_id = serializers.IntegerField(required=False)
    job_title = serializers.CharField(required=False)
    location = serializers.CharField(required=False)
    remote_only = serializers.BooleanField(required=False, default=False)

class SkillsWithProficiencySerializer(serializers.Serializer):
    """Serializer for skills with proficiency"""
    skill = serializers.CharField()
    proficiency = serializers.CharField(required=False)