
export type ResourceType = 'Textbook' | 'Past Paper' | 'Curriculum Guide' | 'Journal';
export type ResourceStatus = 'Available' | 'Out' | 'Digital';

export type Resource = {
  id: string;
  title: string;
  type: ResourceType;
  subject: string;
  grade: string;
  status: ResourceStatus;
  author: string;
  description: string;
  dueDate?: string;
};
