from django.db import models

# Create your models here.

class UserResume(models.Model):
    """Model to store user resume files and extracted skills"""
    file = models.FileField(upload_to='resumes/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_skills = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Resume {self.id} - Uploaded at {self.uploaded_at}"
    
    def get_skills_list(self):
        """Return extracted skills as a list"""
        if self.extracted_skills:
            return [skill.strip() for skill in self.extracted_skills.split(',')]
        return []

class JobSearch(models.Model):
    """Model to store job search parameters"""
    query = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, default="India")
    remote_only = models.BooleanField(default=False)
    employment_types = models.CharField(max_length=255, default="fulltime;parttime;intern;contractor")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Job Search - {self.query} in {self.location}"
        
class UserSkills(models.Model):
    """Model to store user skills separately for easier access"""
    resume = models.ForeignKey(UserResume, on_delete=models.CASCADE, related_name='skills')
    skill = models.CharField(max_length=255)
    proficiency = models.CharField(max_length=50, blank=True, null=True)  # e.g., Beginner, Intermediate, Expert
    
    def __str__(self):
        return self.skill

class SavedJob(models.Model):
    """Model to store jobs saved by users"""
    job_id = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField()
    saved_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} at {self.company}"

class CvTemplate(models.Model):
    """Model to store CV template information"""
    name = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.name} - {self.category}"

class SkillGap(models.Model):
    """Model to store skill gaps identified for a user"""
    resume = models.ForeignKey(UserResume, on_delete=models.CASCADE, related_name='skill_gaps')
    skill = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)  # The job title this skill is needed for
    importance = models.IntegerField(default=1)  # 1-10 scale of importance
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.skill} for {self.job_title}"

class CourseRecommendation(models.Model):
    """Model to store course recommendations for skill gaps"""
    skill_gap = models.ForeignKey(SkillGap, on_delete=models.CASCADE, related_name='courses')
    course_name = models.CharField(max_length=255)
    course_url = models.URLField()
    platform = models.CharField(max_length=100, default="Coursera")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course_name} for {self.skill_gap.skill}"

class UserSession(models.Model):
    """Model to store user session data for integrated workflow"""
    session_id = models.CharField(max_length=100, unique=True)
    resume = models.ForeignKey(UserResume, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Session {self.session_id}"
