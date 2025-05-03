import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface CvTemplate {
  id: number;
  name: string;
  file_name: string;
  description: string;
  category: string;
  color?: string;
}

@Component({
  selector: 'app-cv-templates',
  standalone: false,
  templateUrl: './cv-templates.component.html',
  styleUrls: ['./cv-templates.component.css']
})
export class CvTemplatesComponent implements OnInit {
  templates: CvTemplate[] = [];
  filteredTemplates: CvTemplate[] = [];
  categories: string[] = ['All', 'Business', 'Creative', 'Legal', 'Academic', 'Sales', 'Teaching', 'Medical', 'Other'];
  selectedCategory: string = 'All';
  searchQuery: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Category colors mapping
  categoryColors: {[key: string]: string} = {
    'Business': 'var(--primary-color)',
    'Creative': 'var(--accent-color)',
    'Legal': 'var(--secondary-color)',
    'Academic': 'var(--primary-color)',
    'Sales': 'var(--accent-color)',
    'Teaching': 'var(--secondary-color)',
    'Medical': 'var(--primary-color)',
    'Other': 'var(--secondary-color)'
  };
  
  // Backend API URL
  private apiUrl = 'http://localhost:8000/api';
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    this.loadTemplates();
  }
  
  loadTemplates() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Fetch templates from backend API
    this.http.get<any>(`${this.apiUrl}/cv-templates/`).subscribe({
      next: (response) => {
        if (response.success) {
          // Add color property to each template based on category
          this.templates = response.templates.map((template: CvTemplate) => ({
            ...template,
            color: this.categoryColors[template.category] || 'var(--primary-color)'
          }));
          
          this.filteredTemplates = [...this.templates];
          this.isLoading = false;
        } else {
          this.errorMessage = 'Failed to load templates';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.errorMessage = 'Error loading templates: ' + (error.message || 'Unknown error');
        this.isLoading = false;
        
        // Fallback to local data if API fails
        this.loadLocalTemplates();
      }
    });
  }
  
  loadLocalTemplates() {
    // This is a fallback method in case the API fails
    console.log('Falling back to local template data');
    // The existing template data is kept as fallback
    this.templates = [
      {
        id: 1,
        name: 'Classic Management',
        file_name: 'Classic management resume.docx',
        description: 'Professional template for management positions with a classic design.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 2,
        name: 'Swiss Design',
        file_name: 'Swiss design resume.docx',
        description: 'Clean, minimalist design with Swiss typography principles.',
        category: 'Creative',
        color: this.categoryColors['Creative']
      },
      {
        id: 3,
        name: 'Attorney Resume',
        file_name: 'Attorney resume.docx',
        description: 'Professional template for legal practitioners.',
        category: 'Legal',
        color: this.categoryColors['Legal']
      },
      {
        id: 4,
        name: 'Bold Attorney',
        file_name: 'Bold attorney resume.docx',
        description: 'Stand out with this bold design for legal professionals.',
        category: 'Legal',
        color: this.categoryColors['Legal']
      },
      {
        id: 5,
        name: 'Creative Teaching',
        file_name: 'Creative teaching resume.docx',
        description: 'Eye-catching template for educators with a creative flair.',
        category: 'Teaching',
        color: this.categoryColors['Teaching']
      },
      {
        id: 6,
        name: 'Stylish Teaching',
        file_name: 'Stylish teaching resume.docx',
        description: 'Modern design for educators focused on visual presentation.',
        category: 'Teaching',
        color: this.categoryColors['Teaching']
      },
      {
        id: 7,
        name: 'Geometric Resume',
        file_name: 'Geometric resume.docx',
        description: 'Geometric patterns add visual interest to this modern template.',
        category: 'Creative',
        color: this.categoryColors['Creative']
      },
      {
        id: 8,
        name: 'Modern Nursing',
        file_name: 'Modern nursing resume.docx',
        description: 'Clean template designed for healthcare professionals.',
        category: 'Medical',
        color: this.categoryColors['Medical']
      },
      {
        id: 9,
        name: 'Paralegal Resume',
        file_name: 'Paralegal resume.docx',
        description: 'Professional template for paralegal and legal support roles.',
        category: 'Legal',
        color: this.categoryColors['Legal']
      },
      {
        id: 10,
        name: 'Playful Business',
        file_name: 'Playful business resume.docx',
        description: 'Business resume with a playful twist for creative industries.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 11,
        name: 'Social Media Marketing',
        file_name: 'Social media marketing resume.docx',
        description: 'Designed for digital marketers and social media professionals.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 12,
        name: 'Stylish Sales',
        file_name: 'Stylish sales resume.docx',
        description: 'Eye-catching template to showcase your sales achievements.',
        category: 'Sales',
        color: this.categoryColors['Sales']
      },
      {
        id: 13,
        name: 'Modern Bold Sales',
        file_name: 'Modern bold sales resume.docx',
        description: 'Bold design that helps sales professionals stand out.',
        category: 'Sales',
        color: this.categoryColors['Sales']
      },
      {
        id: 14,
        name: 'ATS Bold Accounting',
        file_name: 'ATS Bold accounting resume.docx',
        description: 'ATS-friendly template for accounting professionals.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 15,
        name: 'Modern Hospitality',
        file_name: 'Modern hospitality resume.docx',
        description: 'Clean design for hospitality industry professionals.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 16,
        name: 'ATS Classic HR',
        file_name: 'ATS classic HR resume.docx',
        description: 'ATS-optimized template for human resources professionals.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 17,
        name: 'Color Block Resume',
        file_name: 'Color block resume.docx',
        description: 'Vibrant template with color blocks for creative professionals.',
        category: 'Creative',
        color: this.categoryColors['Creative']
      },
      {
        id: 18,
        name: 'Industry Manager Resume',
        file_name: 'Industry manager resume.docx',
        description: 'Specialized template for industry and manufacturing managers.',
        category: 'Business',
        color: this.categoryColors['Business']
      },
      {
        id: 19,
        name: 'Cover Letter (Referred)',
        file_name: 'Resume cover letter when referred.docx',
        description: 'Cover letter template for when you have been referred by someone.',
        category: 'Other',
        color: this.categoryColors['Other']
      },
      {
        id: 20,
        name: 'Cover Letter (Temporary)',
        file_name: 'Resume cover letter for temporary position.docx',
        description: 'Cover letter template for temporary or contract positions.',
        category: 'Other',
        color: this.categoryColors['Other']
      }
    ];
    
    this.filteredTemplates = [...this.templates];
  }
  
  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }
  
  applySearch() {
    this.applyFilters();
  }
  
  applyFilters() {
    if (this.selectedCategory === 'All' && !this.searchQuery) {
      this.filteredTemplates = [...this.templates];
    } else {
      this.filteredTemplates = this.templates.filter(template => {
        const matchesCategory = this.selectedCategory === 'All' || template.category === this.selectedCategory;
        const matchesSearch = !this.searchQuery || 
          template.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
          template.description.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
      });
    }
  }
  
  downloadTemplate(fileName: string) {
    this.isLoading = true;
    
    // Create a direct link to the backend download endpoint
    const downloadUrl = `${this.apiUrl}/cv-templates/download/${fileName}/`;
    
    // Open the download URL in a new tab
    window.open(downloadUrl, '_blank');
    
    this.isLoading = false;
  }
}
