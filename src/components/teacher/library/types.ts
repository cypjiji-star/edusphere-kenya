
export type ResourceType =
  | "Textbook"
  | "Past Paper"
  | "Curriculum Guide"
  | "Journal";
export type ResourceStatus = "Available" | "Out" | "Digital";

export type Resource = {
  id: string;
  title: string;
  author: string;
  type: ResourceType;
  subject: string;
  grade: string;
  status: ResourceStatus;
  description: string;
  recommended?: boolean;
  totalCopies?: number;
  availableCopies?: number;
  dueDate?: string;
  borrowedBy?: { teacherId: string; teacherName: string; quantity: number }[];
};

      