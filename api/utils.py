import pandas as pd 
import json
import spacy
import requests
import pdfplumber
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter 
from bs4 import BeautifulSoup
import ast
import os
from django.conf import settings

# Load spacy model
try:
    nlp = spacy.load("output2")
except Exception as e:
    print(f"Error loading spaCy model: {e}")
    nlp = None

# Takes file path as input and returns the text from the resume
def extract_pdf_text(path):
    text = ''
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + '\n'
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ''

# Takes raw text extracted from the resume and returns a comma separated string of skills
def extract_skills(text):
    if not nlp:
        return "Error: NLP model not loaded"
    
    skills = []
    try:
        docs = nlp(text)
        for doc in docs.ents:
            skills.append(str.lower(doc.text))
        skills = list(set(skills))
        st = ', '.join(skills)
        return st
    except Exception as e:
        print(f"Error extracting skills: {e}")
        return ''

# To one_hot encode the skills to be used for association rule mining
def one_hot_encode_skills(skills):
    try:
        if isinstance(skills, str):  # If input is a single string
            skills = pd.Series([skills])  # Convert to Series

        # Split each entry by ", " and expand into separate rows
        skills_split = skills.str.get_dummies(sep=", ")
        return skills_split
    except Exception as e:
        print(f"Error one-hot encoding skills: {e}")
        return None

# Takes user skills and job_listings as input and returns a dataframe with jobs sorted by their similarity score
def recommended_jobs(user_skills, job_listings_df=None):
    try:
        # If no job listings provided, load from file
        if job_listings_df is None:
            job_listings_df = pd.read_csv("Job_listings.csv")
            job_listings_df['Skills'] = job_listings_df['description'].apply(lambda x: extract_skills(x))
        
        all_skills = [user_skills] + job_listings_df["Skills"].tolist()  # Combine user skills & job skills
        vectorizer = TfidfVectorizer()
        skill_vectors = vectorizer.fit_transform(all_skills)  # Convert text to numerical vectors
        cosine_sim = cosine_similarity(skill_vectors[0:1], skill_vectors[1:])  # Compare user skills with jobs
        job_listings_df["Similarity Score"] = cosine_sim[0]
        recommended_jobs = job_listings_df.sort_values(by="Similarity Score", ascending=False)
        return recommended_jobs
    except Exception as e:
        print(f"Error getting recommended jobs: {e}")
        return pd.DataFrame()

# Suggests new skills to the user based on their existing skills and skills extracted from the job descriptions
def recommended_skills(user_skills, job_listings, skill_number=None):
    try:
        user_skills = user_skills.split(", ")
        job_listings['Skills_list'] = job_listings['Skills'].apply(lambda x: x.split(", "))
        all_job_skills = [skill for skills_list in job_listings["Skills_list"] for skill in skills_list]
        skill_counts = Counter(all_job_skills)
        missing_skills = set(skill_counts.keys()) - set(user_skills)
        recommended_skills = sorted(missing_skills, key=lambda skill: skill_counts[skill], reverse=True)
        
        if skill_number is None:
            return recommended_skills[:10]
        else:
            return recommended_skills[:skill_number]
    except Exception as e:
        print(f"Error getting recommended skills: {e}")
        return []

# Gets certifications names and links for Certifications based on the specialization entered by the user
def get_certifications(specialization):
    courses = []
    try:
        url = f"https://www.coursera.org/search?query={specialization}&sortBy=BEST_MATCH"
        headers = {"User-Agent": "Mozilla/5.0"}  # Avoid being blocked
        response = requests.get(url, headers=headers)
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract data (Example: Extract all links)
        links = soup.find_all('a', class_='cds-119 cds-113 cds-115 cds-CommonCard-titleLink css-vflzcf cds-142')
        
        for link in links:
            if hasattr(link, 'h3') and link.h3:
                cour = [link.h3.string, "https://www.coursera.org" + link['href']]
                courses.append(cour)
        
        return courses
    except Exception as e:
        print(f"Error getting certifications: {e}")
        return []

# Extracts the links for jobs to apply from the recommended jobs DataFrame
def get_job_links(recommended_jobs):
    try:
        job_links_df = pd.DataFrame(columns=['jobProvider', 'url'])
        for i in recommended_jobs['jobProviders']:
            try:
                li = ast.literal_eval(i)
                if li and len(li) >= 2:  # Ensure there's at least one provider with URL
                    row = pd.DataFrame(data=li[:2], columns=['jobProvider', 'url'])
                    job_links_df = pd.concat([job_links_df, row], ignore_index=True)
            except (ValueError, SyntaxError) as e:
                print(f"Error parsing job provider: {e}")
                continue
        return job_links_df
    except Exception as e:
        print(f"Error getting job links: {e}")
        return pd.DataFrame(columns=['jobProvider', 'url'])

# Fetches job listings 
def fetch_paginated_jobs(query="", location="India", remote_only="false", employment_types="fulltime;parttime;intern;contractor", max_pages=5):
    api_url = "https://jobs-api14.p.rapidapi.com/v2/list"
    
    params = {
        "query": query,
        "location": location,
        "autoTranslateLocation": "true",
        "remoteOnly": remote_only,
        "employmentTypes": employment_types
    }
    
    headers = {
        "x-rapidapi-key": "270fcf7be8msh5fdf506d3962e07p121c1ejsnffafc65db012",
        "x-rapidapi-host": "jobs-api14.p.rapidapi.com"
    }
    
    all_jobs = []
    next_page = ""  # Initialize nextPage as empty

    try:
        for _ in range(max_pages):  # Limit number of pages to fetch
            if next_page:  # Add nextPage token only if it exists
                params["nextPage"] = next_page
                
            response = requests.get(api_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

            jobs = data.get("jobs", [])  # Extract job data
            all_jobs.extend(jobs)

            # Get nextPage token for next request
            next_page = data.get("nextPage")  # Adjust based on API response

            if not next_page:  # Stop if no more pages
                break
    except requests.exceptions.RequestException as e:
        print(f"Error fetching jobs: {e}")
        
    return all_jobs

# Process resume and return extracted information
def process_resume(file_path):
    try:
        # Extract text from resume
        text = extract_pdf_text(file_path)
        
        # Extract skills from the text
        skills_text = extract_skills(text)
        
        # Return structured data
        return {
            'success': True,
            'skills': skills_text.split(', ') if skills_text else [],
            'skills_text': skills_text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get job recommendations based on user skills
def get_job_recommendations(skills_text):
    try:
        # Load job listings
        job_listings = pd.read_csv("Job_listings.csv")
        
        # Extract skills from job descriptions if not already present
        if 'Skills' not in job_listings.columns:
            job_listings['Skills'] = job_listings['description'].apply(lambda x: extract_skills(x))
        
        # Get recommended jobs
        rec_jobs = recommended_jobs(skills_text, job_listings)
        
        # Prepare response data
        jobs_data = []
        for _, job in rec_jobs.head(10).iterrows():
            jobs_data.append({
                'id': job['id'],
                'title': job['title'],
                'company': job['company'],
                'similarity_score': float(job['Similarity Score']),
                'description': job['description'][:200] + '...' if len(job['description']) > 200 else job['description'],
                'location': job['location']
            })
        
        # Return structured data
        return {
            'success': True,
            'jobs': jobs_data
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get skill recommendations based on user skills
def get_skill_recommendations(skills_text, skill_count=10):
    try:
        # Load job listings
        job_listings = pd.read_csv("Job_listings.csv")
        
        # Extract skills from job descriptions if not already present
        if 'Skills' not in job_listings.columns:
            job_listings['Skills'] = job_listings['description'].apply(lambda x: extract_skills(x))
        
        # Get recommended skills
        rec_skills = recommended_skills(skills_text, job_listings, skill_count)
        
        # Return structured data
        return {
            'success': True,
            'recommended_skills': rec_skills
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get course recommendations based on job title
def get_course_recommendations(job_title):
    try:
        # Get certification courses
        courses_data = get_certifications(job_title)
        
        # Format courses into list of dictionaries
        courses = []
        for course in courses_data:
            if len(course) >= 2:
                courses.append({
                    'name': course[0],
                    'url': course[1]
                })
        
        # Return structured data
        return {
            'success': True,
            'courses': courses
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get job application links
def get_application_links(job_id):
    try:
        # Load job listings
        job_listings = pd.read_csv("Job_listings.csv")
        
        # Find the specific job
        job = job_listings[job_listings['id'] == job_id]
        
        if job.empty:
            return {
                'success': False,
                'error': 'Job not found'
            }
        
        # Get job links
        job_links = get_job_links(job)
        
        # Format links into list of dictionaries
        links = []
        for _, link in job_links.iterrows():
            links.append({
                'provider': link['jobProvider'],
                'url': link['url']
            })
        
        # Return structured data
        return {
            'success': True,
            'links': links
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Fetch jobs from external API
def fetch_jobs_api(query="", location="India", remote="false", employment_types="fulltime;parttime;intern;contractor"):
    try:
        # Fetch jobs from API
        jobs = fetch_paginated_jobs(
            query=query,
            location=location,
            remote_only=remote,
            employment_types=employment_types
        )
        
        # Return structured data
        return {
            'success': True,
            'jobs': jobs
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        } 

# Identify skill gaps between user skills and job requirements
def identify_skill_gaps(user_skills_text, job_title, job_description=None):
    try:
        # Get user skills as a list
        user_skills = user_skills_text.split(', ') if user_skills_text else []
        user_skills = [skill.lower() for skill in user_skills]
        
        # If job description is provided, extract skills from it
        job_skills = []
        if job_description:
            job_skills_text = extract_skills(job_description)
            job_skills = job_skills_text.split(', ') if job_skills_text else []
        else:
            # Otherwise, find similar jobs in the database and extract skills
            job_listings = pd.read_csv("Job_listings.csv")
            
            # Filter by job title if provided
            if job_title:
                similar_jobs = job_listings[job_listings['title'].str.contains(job_title, case=False, na=False)]
                if len(similar_jobs) == 0:  # If no exact matches, use all jobs
                    similar_jobs = job_listings
            else:
                similar_jobs = job_listings
            
            # Extract skills from job descriptions
            if 'Skills' not in similar_jobs.columns:
                similar_jobs['Skills'] = similar_jobs['description'].apply(lambda x: extract_skills(x))
            
            # Get all skills from similar jobs
            all_job_skills = []
            for skills_text in similar_jobs['Skills']:
                if skills_text:
                    all_job_skills.extend(skills_text.split(', '))
            
            # Count skill frequency
            skill_counts = Counter(all_job_skills)
            
            # Get top skills (most frequently mentioned)
            job_skills = [skill for skill, count in skill_counts.most_common(20)]
        
        # Identify missing skills (skills in job but not in user's profile)
        missing_skills = [skill for skill in job_skills if skill.lower() not in user_skills]
        
        # Calculate importance based on frequency or position in the list
        skill_gaps = []
        for i, skill in enumerate(missing_skills[:10]):  # Limit to top 10 missing skills
            importance = 10 - i  # Higher importance for skills earlier in the list
            skill_gaps.append({
                'skill': skill,
                'job_title': job_title or 'General Job',
                'importance': importance
            })
        
        return {
            'success': True,
            'skill_gaps': skill_gaps
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get course recommendations for skill gaps
def get_skill_gap_courses(skill_gaps):
    try:
        courses_by_skill = {}
        
        for skill_gap in skill_gaps:
            skill = skill_gap['skill']
            
            # Get courses for this skill
            courses_data = get_certifications(skill)
            
            # Format courses
            courses = []
            for course in courses_data:
                if len(course) >= 2:
                    courses.append({
                        'course_name': course[0],
                        'course_url': course[1],
                        'platform': 'Coursera',
                        'skill_gap_id': skill_gap.get('id')
                    })
            
            # Store courses for this skill
            courses_by_skill[skill] = courses[:3]  # Limit to top 3 courses per skill
        
        return {
            'success': True,
            'courses_by_skill': courses_by_skill
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Integrated workflow function that combines all steps
def integrated_workflow(resume_id=None, user_skills_text=None, job_title=None, location=None, remote_only=False):
    try:
        results = {
            'success': True,
            'steps_completed': [],
            'resume_id': resume_id,
            'extracted_skills': [],
            'job_recommendations': [],
            'skill_gaps': [],
            'course_recommendations': {}
        }
        
        # Step 1: Get user skills (either from resume or directly provided)
        if resume_id:
            from .models import UserResume
            try:
                resume = UserResume.objects.get(id=resume_id)
                user_skills_text = resume.extracted_skills
                results['extracted_skills'] = resume.get_skills_list()
                results['steps_completed'].append('skill_extraction')
            except UserResume.DoesNotExist:
                return {
                    'success': False,
                    'error': f'Resume with ID {resume_id} not found'
                }
        elif user_skills_text:
            results['extracted_skills'] = user_skills_text.split(', ') if user_skills_text else []
            results['steps_completed'].append('skill_extraction')
        else:
            return {
                'success': False,
                'error': 'Either resume_id or user_skills_text must be provided'
            }
        
        # Step 2: Get job recommendations
        job_rec_result = get_job_recommendations(user_skills_text)
        if job_rec_result['success']:
            results['job_recommendations'] = job_rec_result['jobs']
            results['steps_completed'].append('job_recommendations')
            
            # If job title not provided, use the top recommended job
            if not job_title and results['job_recommendations']:
                job_title = results['job_recommendations'][0]['title']
        
        # Step 3: Identify skill gaps
        if job_title:
            # Get job description if available
            job_description = None
            if results['job_recommendations']:
                for job in results['job_recommendations']:
                    if job['title'] == job_title:
                        job_description = job.get('description', '')
                        break
            
            skill_gaps_result = identify_skill_gaps(user_skills_text, job_title, job_description)
            if skill_gaps_result['success']:
                results['skill_gaps'] = skill_gaps_result['skill_gaps']
                results['steps_completed'].append('skill_gaps')
        
        # Step 4: Get course recommendations for skill gaps
        if results['skill_gaps']:
            courses_result = get_skill_gap_courses(results['skill_gaps'])
            if courses_result['success']:
                results['course_recommendations'] = courses_result['courses_by_skill']
                results['steps_completed'].append('course_recommendations')
        
        return results
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }