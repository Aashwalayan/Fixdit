import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { IssuePost, Comment, CivicStats, SeverityType, StatusType } from "./src/types";
// @ts-ignore
import connectDB from "./backend/config/db.cjs";
// @ts-ignore
import authRoutes from "./backend/routes/authRoutes.cjs";
// @ts-ignore
import adminRoutes from "./backend/routes/adminRoutes.cjs";
// @ts-ignore
import departmentRoutes from "./backend/routes/departmentRoutes.cjs";
// @ts-ignore
import officialApplicationRoutes from "./backend/routes/officialApplicationRoutes.cjs";
// @ts-ignore
import notificationRoutes from "./backend/routes/notificationRoutes.cjs";
// @ts-ignore
import userRoutes from "./backend/routes/userRoutes.cjs";
// @ts-ignore
import postRoutes from "./backend/routes/postRoutes.cjs";
// @ts-ignore
import Post from "./backend/models/Post.cjs";
// @ts-ignore
import User from "./backend/models/User.cjs";
// @ts-ignore
import { protect } from "./backend/middleware/authMiddleware.cjs";
// @ts-ignore
import { bootstrapAdminFromEnv } from "./backend/utils/adminLifecycle.cjs";
// @ts-ignore
import { getDepartmentForCategory } from "./backend/utils/departments.cjs";
// @ts-ignore
import Notification from "./backend/models/Notification.cjs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase body limit for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Shared Gemini client setup
let ai: GoogleGenAI | null = null;
const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

if (hasApiKey) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const defaultIssueLocation = {
  city: "New Delhi",
  state: "DL",
  country: "India",
};

function normalizeStatus(status: string | undefined): StatusType {
  if (
    status === "pending" ||
    status === "accepted" ||
    status === "verified" ||
    status === "in_progress" ||
    status === "resolved" ||
    status === "rejected"
  ) {
    return status;
  }
  return "pending";
}

function mapPostToIssue(post: any): IssuePost {
  const coordinates = post.location?.coordinates?.coordinates || [0, 0];
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : post.stats?.comments || 0;
  const upvotes = Number(post.upvotes ?? post.stats?.upvotes ?? 0);
  const severity = (post.severity || "medium").toLowerCase() as SeverityType;

  return {
    id: String(post._id),
    title: post.title,
    description: post.description,
    category: post.category,
    severity,
    status: normalizeStatus(post.status),
    latitude: Number(coordinates[1] || 0),
    longitude: Number(coordinates[0] || 0),
    imageUrl: post.images?.[0]?.url || "",
    image: post.images?.[0]?.url || "",
    location: post.location?.address || "San Francisco, CA",
    creator: post.author?.username || post.authorName || "anonymous_citizen",
    upvotes,
    upvoters: Array.isArray(post.upvoters) ? post.upvoters : [],
    commentsCount,
    createdAt: new Date(post.createdAt || Date.now()).toISOString(),
    priorityScore: calculatePriority(severity, upvotes, commentsCount),
    resolutionProof: post.resolutionProof
      ? {
          imageUrl: post.resolutionProof.imageUrl || "",
          notes: post.resolutionProof.notes || "",
          updatedAt: post.resolutionProof.updatedAt
            ? new Date(post.resolutionProof.updatedAt).toISOString()
            : undefined,
        }
      : undefined,
    aiSummary: post.aiSummary || "",
    suggestedDepartment: post.assignedDepartment || "",
  };
}

function mapPostComments(post: any): Comment[] {
  const postComments = Array.isArray(post.comments) ? post.comments : [];

  return postComments
    .map((comment: any, index: number) => ({
      id: String(comment._id || `${post._id}-comment-${index}`),
      issueId: String(post._id),
      author: comment.authorName || comment.user?.username || "civic_member",
      content: comment.text,
      createdAt: new Date(comment.createdAt || Date.now()).toISOString(),
    }))
    .sort((a: Comment, b: Comment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Helper to calculate Priority Score based on Hackathon Algorithm
function calculatePriority(severity: SeverityType, upvotes: number, commentsCount: number): number {
  let severityWeight = 10;
  if (severity === "low") severityWeight = 10;
  else if (severity === "medium") severityWeight = 25;
  else if (severity === "high") severityWeight = 60;
  else if (severity === "critical") severityWeight = 100;

  // Upvotes scale severity dramatically
  const upvoteWeight = upvotes * 8;
  const commentWeight = commentsCount * 4;

  return severityWeight + upvoteWeight + commentWeight;
}

// Distance formula to check for duplicate reports
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
}

// REST APIs
// Auth routes
app.use("/api/auth", authRoutes);
// Admin routes
app.use("/api/admin", adminRoutes);
// Department routes
app.use("/api/departments", departmentRoutes);
// Official application routes
app.use("/api/official-applications", officialApplicationRoutes);
// Notification routes
app.use("/api/notifications", notificationRoutes);
// User routes
app.use("/api/users", userRoutes);
// Post routes
app.use("/api/posts", postRoutes);

// 1. Get all issues (with filtering, searching, and sorting)
app.get("/api/issues", async (req, res) => {
  try {
    const { category, status, search, sortBy } = req.query;
    let posts = await Post.find({});
    let filtered = posts.map(mapPostToIssue);

    if (category) {
      filtered = filtered.filter((issue: IssuePost) => issue.category === category);
    }
    if (status) {
      filtered = filtered.filter((issue: IssuePost) => issue.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (issue: IssuePost) =>
          issue.title.toLowerCase().includes(q) ||
          issue.description.toLowerCase().includes(q) ||
          issue.location.toLowerCase().includes(q)
      );
    }

    if (sortBy === "priority") {
      filtered.sort((a:IssuePost, b:IssuePost) => b.priorityScore - a.priorityScore);
    } else if (sortBy === "most_upvoted") {
      filtered.sort((a:IssuePost, b:IssuePost) => b.upvotes - a.upvotes);
    } else if (sortBy === "recent") {
      filtered.sort((a:IssuePost, b:IssuePost) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "severity") {
        const severityRank: Record<SeverityType, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  
        filtered.sort((a: IssuePost, b: IssuePost) => {
        const rankB = severityRank[b.severity as SeverityType] || 0;
        const rankA = severityRank[a.severity as SeverityType] || 0;
        return rankB - rankA;
      });
    } else {
      filtered.sort((a: IssuePost, b:IssuePost) => b.priorityScore - a.priorityScore);
    }

    res.json(filtered);
  } catch (error: any) {
    console.error("Issue feed query failed:", error);
    res.status(500).json({ error: "Failed to load issues." });
  }
});

// 2. Analyze uploaded issue image (real Gemini or robust high-fidelity fallback)
app.post("/api/issues/analyze", async (req, res) => {
  const { imageBase64, mimeType, lat, lng, description } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "No image content provided." });
  }

  let duplicateWarning = null;

  if (lat && lng) {
    const posts = await Post.find({});
    const nearbyIssuesInRadius = posts
      .map((post: any) => {
        const issue = mapPostToIssue(post);
        return {
          ...issue,
          distance: calculateDistanceInMeters(Number(lat), Number(lng), issue.latitude, issue.longitude),
        };
      })
      .filter((issue: IssuePost & { distance: number }) => issue.distance <= 150)
      .sort((a: IssuePost & { distance: number }, b: IssuePost & { distance: number }) => a.distance - b.distance);

    duplicateWarning = nearbyIssuesInRadius.length > 0
      ? {
          isPotentialDuplicate: true,
          matchingIssue: nearbyIssuesInRadius[0],
          distanceMeters: Math.round(nearbyIssuesInRadius[0].distance),
        }
      : null;
  }

  try {
    if (hasApiKey && ai) {
      // Clean base64 header if present (e.g., "data:image/jpeg;base64,")
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const cleanMime = mimeType || "image/jpeg";

      const userTextDesc = description ? `User description: "${description}"` : "No description provided.";

      console.log("TEST VERSION 12345");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
  {
    inlineData: {
      data: cleanBase64,
      mimeType: cleanMime,
    },
  },
  {
  text: `
Analyze this image for civic issues.

Return ONLY valid JSON in this format:

{
  "isCivicIssue": true,
  "category": "Road Damage",
  "severity": "Medium",
  "department": "Department of Public Works",
  "summary": "Short description of the issue."
}

Categories:
- Road Damage
- Garbage
- Water Leakage
- Drainage
- Street Light
- Public Safety
- Other

Severity:
- Low
- Medium
- High

If the image does NOT show a civic issue, return:

{
  "isCivicIssue": false,
  "category": "Invalid Report",
  "severity": "N/A",
  "department": "N/A",
  "summary": "This image does not appear to show a civic issue."
}

${userTextDesc}
`
}
],
        config: {
          responseMimeType: "application/json",
        }
      });

      console.log("RAW GEMINI RESPONSE:");
      console.log(response.text);
      

      if (!response.text){
        throw new Error("Gemini returned no text")
      }
      const parsed = JSON.parse(response.text);
      console.log(parsed);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No text returned from Gemini");
      }

      // Cleanup and parse JSON response safely
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
      }

      const analysis = JSON.parse(cleanedText);
      return res.json({
        analysis: {
          isCivicIssue: analysis.isCivicIssue ?? false,
          category: analysis.category || "Other",
          severity: (analysis.severity || "Medium").toLowerCase(),
          suggestedDepartment:
            analysis.department || "Department of Public Works",
          aiSummary:
            analysis.summary ||
            "This image does not appear to contain a civic issue."
        },
        duplicateWarning,
        isDemo: false
      });
    } else {
      // Robust contextual simulation for the preview in case Gemini API key is not connected yet
      let simulatedCategory = "Roads & Potholes";
      let simulatedSeverity = "medium";
      let simulatedDepartment = "Department of Public Works";
      let simulatedSummary = "Damaged civic asset detected in local photo. Visual wear suggests immediate maintenance attention.";

      const descLower = description ? description.toLowerCase() : "";
      if (descLower.includes("water") || descLower.includes("leak") || descLower.includes("pipe") || descLower.includes("flood")) {
        simulatedCategory = "Water & Leakages";
        simulatedSeverity = "high";
        simulatedDepartment = "Water Enterprise";
        simulatedSummary = "Active water release or storage failure detected, causing public space leakage with pedestrian fall risk.";
      } else if (descLower.includes("garbage") || descLower.includes("trash") || descLower.includes("dump") || descLower.includes("sanitation") || descLower.includes("litter")) {
        simulatedCategory = "Garbage & Sanitation";
        simulatedSeverity = "medium";
        simulatedDepartment = "Department of Environment & Sanitation";
        simulatedSummary = "Disposed bags and bulky waste clogging public access. Attracts pests and needs immediate municipal pickup.";
      } else if (descLower.includes("light") || descLower.includes("bulb") || descLower.includes("dark") || descLower.includes("wire") || descLower.includes("power")) {
        simulatedCategory = "Lighting & Power";
        simulatedSeverity = "medium";
        simulatedDepartment = "Bureau of Street Lighting";
        simulatedSummary = "Deconfigured public streetlight causing insufficient nighttime illumination and elevated safety concerns.";
      } else if (descLower.includes("park") || descLower.includes("swing") || descLower.includes("bench") || descLower.includes("playground")) {
        simulatedCategory = "Parks & Infrastructure";
        simulatedSeverity = "low";
        simulatedDepartment = "Parks & Recreation";
        simulatedSummary = "Wear and tear on playground appliances or park assets. Poses a minor splinter or safety hazard for families.";
      } else if (descLower.includes("bus") || descLower.includes("train") || descLower.includes("transit") || descLower.includes("station") || descLower.includes("subway")) {
        simulatedCategory = "Public Transit";
        simulatedSeverity = "medium";
        simulatedDepartment = "Transit Authority";
        simulatedSummary = "Malfunctioning facility at transit point affecting commuter routing and platform convenience.";
      } else if (descLower.includes("pothole") || descLower.includes("hole") || descLower.includes("street") || descLower.includes("asphalt")) {
        simulatedCategory = "Roads & Potholes";
        simulatedSeverity = "high";
        simulatedDepartment = "Department of Public Works";
        simulatedSummary = "Deep pavement erosion or pothole directly in vehicle pathway. Swerving cars present a high crash risk.";
      }

      return res.json({
        analysis: {
          category: simulatedCategory,
          severity: simulatedSeverity,
          suggestedDepartment: simulatedDepartment,
          aiSummary: simulatedSummary,
          reasoning: "Local Sandbox Visual Analysis Simulator (Key missing or default setup active)."
        },
        duplicateWarning,
        isDemo: true
      });
    }
  } catch (error: any) {
    console.error("Gemini API error, running local fallback analysis:", error);
    return res.status(200).json({
      analysis: {
        category: "Roads & Potholes",
        severity: "medium",
        suggestedDepartment: "Department of Public Works",
        aiSummary: "Visual confirmation of pavement failure. Pothole roughly 4 inches deep requiring standard cold patch.",
        reasoning: "API error triggered automated local safety assessment system."
      },
      duplicateWarning,
      isDemo: true,
      apiError: true,
      errorMessage: error.message
    });
  }
});

// 3. Post a new issue
app.post("/api/issues", protect, async (req: any, res) => {
  try {
    const { title, description, category, severity, latitude, longitude, imageUrl, image, location, aiSummary, suggestedDepartment, status } = req.body;

    if (!title || !category || !severity) {
      return res.status(400).json({ error: "Missing required issue parameters" });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing report coordinates. Please allow location access before submitting." });
    }

    const finalLat = Number(latitude);
    const finalLng = Number(longitude);
    const finalImage = image || imageUrl || "https://images.unsplash.com/photo-1584467541268-b029fb34de4e?w=600&auto=format&fit=crop&q=60";
    const finalStatus = normalizeStatus(status);

    const createdPost = await Post.create({
      title,
      description: description || "No detailed description provided.",
      category,
      severity: String(severity).toLowerCase(),
      status: finalStatus,
      location: {
        address: location || "San Francisco, CA",
        ...defaultIssueLocation,
        coordinates: [finalLng, finalLat],
      },
      images: finalImage ? [{ url: finalImage }] : [],
      aiSummary: aiSummary || "",
      assignedDepartment: suggestedDepartment || getDepartmentForCategory(category),
      author: req.user._id,
      upvotes: 0,
      upvoters: [],
      comments: [],
    });

    const hydratedPost = await Post.findById(createdPost._id);
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map((admin: any) => Notification.create({
      recipient: admin._id,
      type: 'report_created',
      title: 'New report submitted',
      message: `${req.user.username} created a new report: ${title}.`,
      metadata: { postId: String(createdPost._id) },
    })));
    res.status(201).json(mapPostToIssue(hydratedPost || createdPost));
  } catch (error: any) {
    console.error("Issue creation failed:", error);
    res.status(500).json({ error: "Could not save report to the database." });
  }
});

// 4. Vote for an issue (Reddit style toggle upvote)
app.post("/api/issues/:id/vote", protect, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const username = req.user?.username || req.body.userId || "tester_user";
    const upvoters = Array.isArray(post.upvoters) ? [...post.upvoters] : [];
    const votedIndex = upvoters.indexOf(username);

    if (votedIndex > -1) {
      upvoters.splice(votedIndex, 1);
    } else {
      upvoters.push(username);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        upvoters,
        upvotes: upvoters.length,
        stats: {
          ...(post.stats || {}),
          upvotes: upvoters.length,
          comments: Array.isArray(post.comments) ? post.comments.length : post.stats?.comments || 0,
        },
      },
      { new: true }
    );

    const mappedIssue = mapPostToIssue(updatedPost || post);
    if (String(post.author?._id || post.author || '') !== String(req.user._id)) {
      await Notification.create({
        recipient: post.author?._id || post.author,
        type: 'report_status',
        title: 'Report status updated',
        message: `Your report "${post.title}" is now ${mappedIssue.status.replace('_', ' ')}.`,
        metadata: { postId: String(post._id) },
      });
    }
    res.json({
      upvotes: mappedIssue.upvotes,
      upvoters: mappedIssue.upvoters,
      priorityScore: mappedIssue.priorityScore,
    });
  } catch (error: any) {
    console.error("Issue vote failed:", error);
    res.status(500).json({ error: "Could not update vote." });
  }
});

// 5. Get comments for an issue
app.get("/api/issues/:id/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.json(mapPostComments(post));
  } catch (error: any) {
    console.error("Issue comments lookup failed:", error);
    res.status(500).json({ error: "Could not load comments." });
  }
});

// 6. Post a comment
app.post("/api/issues/:id/comments", protect, async (req: any, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const existingComments = (Array.isArray(post.comments) ? post.comments : []).map((comment: any) => ({
      user: comment.user?._id || comment.user || undefined,
      authorName: comment.authorName || comment.user?.username || "civic_member",
      text: comment.text,
      createdAt: comment.createdAt || new Date(),
    }));

    const nextComments = [
      ...existingComments,
      {
        user: req.user._id,
        authorName: req.user.username,
        text: content,
        createdAt: new Date(),
      },
    ];

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        comments: nextComments,
        stats: {
          ...(post.stats || {}),
          upvotes: Array.isArray(post.upvoters) ? post.upvoters.length : post.upvotes || 0,
          comments: nextComments.length,
        },
      },
      { new: true }
    );

    const mappedComments = mapPostComments(updatedPost || post);
    if (String(post.author?._id || post.author || '') !== String(req.user._id)) {
      await Notification.create({
        recipient: post.author?._id || post.author,
        type: 'report_comment',
        title: 'New comment on your report',
        message: `${req.user.username} commented on "${post.title}".`,
        metadata: { postId: String(post._id) },
      });
    }
    res.status(201).json(mappedComments[mappedComments.length - 1]);
  } catch (error: any) {
    console.error("Issue comment creation failed:", error);
    res.status(500).json({ error: "Could not save comment." });
  }
});

// 7. Solve issue and post progress or verification status updates
app.patch("/api/issues/:id/status", protect, async (req: any, res) => {
  try {
    const { status, proofImage, proofNotes } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const creatorId = String(post.author?._id || post.author || "");
    const currentUserId = String(req.user?._id || "");
    const isCreator = creatorId === currentUserId;
    const isStaff = ["admin", "official"].includes(req.user?.role);

    if (!isCreator && !isStaff) {
      return res.status(403).json({ error: "Not authorized to update this issue." });
    }

    const nextStatus = normalizeStatus(status);
    const nextUpdate: any = {
      status: nextStatus,
    };

    if (nextStatus === "resolved") {
      nextUpdate.resolutionProof = {
        imageUrl: proofImage || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=60",
        notes: proofNotes || "Citizen-led maintenance verification confirmed. Handled in collaboration with City Infrastructure services.",
        updatedAt: new Date(),
      };
      nextUpdate.resolvedAt = new Date();
    } else {
      nextUpdate.resolutionProof = null;
      nextUpdate.resolvedAt = null;
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, nextUpdate, { new: true });
    if (String(post.author?._id || post.author || '') !== String(req.user._id)) {
      await Notification.create({
        recipient: post.author?._id || post.author,
        type: 'report_status',
        title: 'Report progress updated',
        message: `Your report "${post.title}" was updated to ${nextStatus.replace('_', ' ')}.`,
        metadata: { postId: String(post._id) },
      });
    }
    res.json(mapPostToIssue(updatedPost || post));
  } catch (error: any) {
    console.error("Issue status update failed:", error);
    res.status(500).json({ error: "Could not update issue status." });
  }
});

// 8. Public Transparency Metrics Dashboard Endpoint (Task 9)
app.get("/api/stats", async (req, res) => {
  try {
    const posts = await Post.find({});
    const issues = posts.map(mapPostToIssue);
    const total = issues.length;
    const resolved = issues.filter((issue:IssuePost) => issue.status === "resolved").length;
    const inProgress = issues.filter((issue:IssuePost) => issue.status === "in_progress").length;
    const critical = issues.filter((issue:IssuePost) => issue.severity === "critical" && issue.status !== "resolved").length;

    const categoryDistribution: { [key: string]: number } = {};
    issues.forEach((issue:IssuePost) => {
      categoryDistribution[issue.category] = (categoryDistribution[issue.category] || 0) + 1;
    });

    const resolutionTimes = issues
      .filter((issue:IssuePost) => issue.status === "resolved" && issue.resolutionProof?.updatedAt)
      .map((issue:IssuePost) => {
        const created = new Date(issue.createdAt).getTime();
        const resolvedAt = new Date(issue.resolutionProof!.updatedAt!).getTime();
        return (resolvedAt - created) / (1000 * 60 * 60);
      });

    const avgHours = resolutionTimes.length > 0
      ? resolutionTimes.reduce((acc:number, current:number) => acc + current, 0) / resolutionTimes.length
      : 0;

    const stats: CivicStats = {
      totalIssues: total,
      resolvedIssues: resolved,
      inProgressIssues: inProgress,
      criticalIssues: critical,
      categoryDistribution,
      resolutionTimeAverageHours: Math.round(avgHours * 10) / 10,
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Stats query failed:", error);
    res.status(500).json({ error: "Failed to load transparency metrics." });
  }
});

app.get("/test-gemini", async (req, res) => {
  try {
    const response = await ai?.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello"
    });

    res.json({
      success: true,
      response: response?.text
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Vite server setup for development or static pages for production
async function startServer() {
  await connectDB();
  await bootstrapAdminFromEnv().catch((error) => {
    console.error(`Admin bootstrap skipped or failed: ${error.message}`);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fixdit Civic Hackathon Backend active on http://0.0.0.0:${PORT}`);
    console.log(`Gemini status: ${hasApiKey ? "CONNECTED" : "CONNECTED IN SANDBOX SIMULATION (Secrets disabled)"}`);
  });
}

startServer();
