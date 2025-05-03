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
from bs4 import BeautifulSoup

nlp=spacy.load("output2")


# Takes file path as input and returns the text from the resume
def extract_pdf_text(path):
    text=''
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text+=page.extract_text()+'\n'
    return text

# Takes raw text extracted from the resume and returns a comma separated string of skills
def extract_skills(text):
    skills=[]
    docs=nlp(text)
    for doc in docs.ents:
        skills.append(str.lower(doc.text))
    skills=list(set(skills))
    # return skills
    st=', '.join(skills)
    return st

# To one_hot encode the skills to be used for association rule mining
def one_hot_encode_skills(skills):
    if isinstance(skills, str):  # If input is a single string
        skills = pd.Series([skills])  # Convert to Series

    # Split each entry by ", " and expand into separate rows
    skills_split = skills.str.get_dummies(sep=", ")
    return skills_split

# Takes user skills and job_listings as input and returns a dataframe with jobs sorted by their similarity score
def recommended_jobs(user_skills,job_listings):
    all_skills = [user_skills] + job_listings["Skills"].tolist()  # Combine user skills & job skills
    vectorizer = TfidfVectorizer()
    skill_vectors = vectorizer.fit_transform(all_skills)  # Convert text to numerical vectors
    cosine_sim = cosine_similarity(skill_vectors[0:1], skill_vectors[1:])  # Compare user skills with jobs
    job_listings["Similarity Score"] = cosine_sim[0]
    recommended_jobs = job_listings.sort_values(by="Similarity Score", ascending=False)
    return recommended_jobs

# Suggests new skills to the user based on their existing skills and skills extracted from the job descriptions
def recommended_skills(user_skills,job_listings,Skill_number=None):
    user_skills=user_skills.split(", ")
    job_listings['Skills_list']=job_listings['Skills'].apply(lambda x: x.split(", "))
    all_job_skills = [skill for skills_list in job_listings["Skills_list"] for skill in skills_list]
    skill_counts = Counter(all_job_skills)
    missing_skills = set(skill_counts.keys()) - set(user_skills)
    recommended_skills = sorted(missing_skills, key=lambda skill: skill_counts[skill], reverse=True)
    # 5️ Display Top Suggested Skills
    if Skill_number is None:
        return recommended_skills[:10]
    else:
        return recommended_skills[:Skill_number]
        
# Gets certifications names and links for Certifications based on the specialization entered by the user and returns in form of a DataFrame
def get_certifications(specialization):
    Courses=[]
    url = f"https://www.coursera.org/search?query={specialization}&sortBy=BEST_MATCH"
    headers = {"User-Agent": "Mozilla/5.0"}  # Avoid being blocked
    response = requests.get(url, headers=headers)
    # Step 2: Parse the HTML content
    soup = BeautifulSoup(response.text, "html.parser")
    # Step 3: Extract data (Example: Extract all links)
    links = soup.find_all('a',class_='cds-119 cds-113 cds-115 cds-CommonCard-titleLink css-vflzcf cds-142')  # Find all <a> (anchor) tags
    # print(links.prettify())
    for link in links:
        cour=[link.h3.string,"https://www.coursera.org"+link['href']]
        Courses.append(cour)
    return Courses

# Extracts the links for jobs to apply from the recommended jobs DataFrame
def get_job_links(recommended_jobs):
    job_links_df=pd.DataFrame(columns=['jobProvider','url'])
    for i in recommended_jobs['jobProviders']:
        li=ast.literal_eval(i)
        row=pd.DataFrame(data=li[:2],columns=['jobProvider','url'])
        job_links_df=pd.concat([job_links_df,row],ignore_index=True)
    return job_links_df


# Fetches job listings 
def fetch_paginated_jobs(api_url, params, headers=None, max_pages=5):
    all_jobs = []
    next_page = ""  # Initialize nextPage as empty

    for _ in range(max_pages):  # Limit number of pages to fetch
        if next_page:  # Add nextPage token only if it exists
            params["nextPage"] = next_page
        try:
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
            break

    return all_jobs

# Example Usage
api_url = "https://jobs-api14.p.rapidapi.com/v2/list"

params = {"query":"",
            "location":"India",
            "autoTranslateLocation":"true",
            "remoteOnly":"false",
            "employmentTypes":"fulltime;parttime;intern;contractor"}

headers = {
	"x-rapidapi-key": "270fcf7be8msh5fdf506d3962e07p121c1ejsnffafc65db012",
	"x-rapidapi-host": "jobs-api14.p.rapidapi.com"
}

profile=None
Location=None
remote=None


if profile:
    params['query']=profile
if Location:
    params['location']=Location 
if remote:
    params['remoteOnly']=remote



jobs_df=pd.read_csv("Job_listings.csv")
listings=pd.DataFrame(jobs_df)
#  listings.to_csv('Job_listings.csv',index=False)
listings['Skills']=listings['description'].apply(lambda x:extract_skills(x))
print(listings)


def main():
    text=extract_pdf_text("specialised2vansh.pdf")
    Skills_text=extract_skills(text)
    print('The user has the Following Skills: \n')
    for i in Skills_text.split(', '):
        print(i)

    
    print('\nThe Following Jobs match the user profile and are sorted in the descending order of similarity: ')
    rec_jobs=recommended_jobs(Skills_text,listings)
    print(rec_jobs[['id','title','Similarity Score']])

    print('\nThe following Skills can be added to the user resume based\non the extracted Skills from the user resume and Job listings data received:\n')
    rec_skills=recommended_skills(Skills_text,listings)
    for i in rec_skills:
        print(i)

    Courses=get_certifications(rec_jobs['title'])
    Courses=pd.DataFrame(data=Courses,columns=['Course','Link'])
    print('\n The user Can get Following Certifications\n')
    print(Courses)

    print("\nHere are the links to the Job listings\n")
    jobs_links=get_job_links(rec_jobs)
    print(jobs_links)
    
main()
    
    