export interface CvAnalysis {
  fileId: string;
  overallScore: number;
  improvementAreas: ImprovementArea[];
  keywords: Keyword[];
  recommendations: string[];
}

export interface ImprovementArea {
  name: string;
  score: number;
  status: 'Needs Improvement' | 'Needs Attention' | 'Good' | 'Very Good' | 'Excellent';
  statusClass: 'danger' | 'warning' | 'info' | 'success';
  recommendation: string;
}

export interface Keyword {
  text: string;
  isPresent: boolean;
} 