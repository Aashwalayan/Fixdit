import { IssuePost, SeverityType, StatusType } from '../types';

const normalizeStatus = (status: string | undefined): StatusType => {
  if (
    status === 'pending' ||
    status === 'accepted' ||
    status === 'verified' ||
    status === 'in_progress' ||
    status === 'resolved' ||
    status === 'rejected'
  ) {
    return status;
  }
  return 'pending';
};

export const mapPostToIssue = (post: any): IssuePost => {
  const coordinates = post.location?.coordinates?.coordinates || [0, 0];
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : post.stats?.comments || 0;
  const upvotes = Number(post.upvotes ?? post.stats?.upvotes ?? 0);
  const downvotes = Number(post.downvotes ?? post.stats?.downvotes ?? 0);
  const severity = (post.severity || 'medium').toLowerCase() as SeverityType;

  return {
    id: String(post._id),
    title: post.title || '',
    description: post.description || '',
    category: post.category || 'Uncategorized',
    severity,
    status: normalizeStatus(post.status),
    latitude: Number(coordinates[1] || 0),
    longitude: Number(coordinates[0] || 0),
    imageUrl: post.images?.[0]?.url || '',
    image: post.images?.[0]?.url || '',
    location: post.location?.address || 'Unknown location',
    creator: post.author?.username || post.authorName || 'anonymous_citizen',
    upvotes,
    upvoters: Array.isArray(post.upvoters) ? post.upvoters : [],
    downvotes,
    downvoters: Array.isArray(post.downvoters) ? post.downvoters : [],
    commentsCount,
    createdAt: new Date(post.createdAt || Date.now()).toISOString(),
    priorityScore: calculatePriority(severity, upvotes, commentsCount),
    resolutionProof: post.resolutionProof
      ? {
          imageUrl: post.resolutionProof.imageUrl || '',
          notes: post.resolutionProof.notes || '',
          updatedAt: post.resolutionProof.updatedAt
            ? new Date(post.resolutionProof.updatedAt).toISOString()
            : undefined,
        }
      : undefined,
    aiSummary: post.aiSummary || '',
    suggestedDepartment: post.assignedDepartment || '',
  };
};

function calculatePriority(severity: SeverityType, upvotes: number, commentsCount: number): number {
  let severityWeight = 10;
  if (severity === 'low') severityWeight = 10;
  else if (severity === 'medium') severityWeight = 25;
  else if (severity === 'high') severityWeight = 60;
  else if (severity === 'critical') severityWeight = 100;

  const upvoteWeight = upvotes * 8;
  const commentWeight = commentsCount * 4;

  return severityWeight + upvoteWeight + commentWeight;
}

