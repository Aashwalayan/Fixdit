export interface ResolutionProof {
  imageUrl?: string;
  notes?: string;
  updatedAt?: string;
}

export type SeverityType = 'critical' | 'high' | 'medium' | 'low';
export type StatusType = 'pending' | 'accepted' | 'in_progress' | 'resolved' | 'verified' | 'rejected';

export interface IssuePost {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: SeverityType;
  status: StatusType | string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  image?: string; // Support direct image property
  location: string; // Required location input field
  creator: string;
  upvotes: number;
  upvoters: string[]; // List of user IDs/emails who upvoted
  commentsCount: number;
  createdAt: string;
  priorityScore: number;
  resolutionProof?: ResolutionProof;
  aiSummary?: string; // Brief AI summary determined by Gemini
  suggestedDepartment?: string; // Suggested responsible department
}

export interface Comment {
  id: string;
  issueId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface CivicStats {
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  criticalIssues: number;
  categoryDistribution: { [key: string]: number };
  resolutionTimeAverageHours: number;
}
