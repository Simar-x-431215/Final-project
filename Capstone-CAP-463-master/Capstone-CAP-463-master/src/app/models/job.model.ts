export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  url?: string;
  date_posted?: string;
  date_saved?: string;
  similarity_score?: number;
  skills?: string[];
  employment_type?: string;
  salary?: string;
  remote?: boolean;
}
