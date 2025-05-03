import os
import sys
import subprocess
import time

def run_command(command):
    """Run a shell command and display its output"""
    print(f"Running: {command}")
    process = subprocess.Popen(command, shell=True)
    process.wait()
    return process.returncode

def setup_and_run():
    """Setup and run the Django server"""
    # Check if media directory exists, if not create it
    if not os.path.exists('media'):
        os.makedirs('media')
        print("Created media directory")
    
    if not os.path.exists('media/resumes'):
        os.makedirs('media/resumes')
        print("Created media/resumes directory")
    
    # Make migrations
    print("\n=== Running migrations ===")
    run_command("python manage.py makemigrations")
    run_command("python manage.py migrate")
    
    # Create superuser if needed
    try:
        from django.contrib.auth.models import User
        if not User.objects.filter(is_superuser=True).exists():
            print("\n=== Creating admin user ===")
            print("Username: admin")
            print("Password: admin")
            User.objects.create_superuser('admin', 'admin@example.com', 'admin')
            print("Admin user created successfully!")
    except Exception as e:
        print(f"Error creating superuser: {e}")
    
    # Run server
    print("\n=== Starting server ===")
    run_command("python manage.py runserver 0.0.0.0:8000")

if __name__ == "__main__":
    # Add project root to path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Setup Django environment
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "job_recommender_api.settings")
    
    # Import Django and setup
    import django
    django.setup()
    
    # Run setup and server
    setup_and_run() 