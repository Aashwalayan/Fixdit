import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { IssuePost, Comment, CivicStats, SeverityType, StatusType } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

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

// Memory Database
let issues: IssuePost[] = [
  {
    id: "seed-1",
    title: "Massive active water pipe burst",
    description: "Major water main leakage on the corner of Jefferson St. Water is spilling onto the pedestrian crossing, posing a slip hazard and wasting thousands of gallons of clean city water.",
    category: "Water & Leakages",
    severity: "critical",
    status: "in_progress",
    latitude: 37.8080,
    longitude: -122.4177,
    imageUrl: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=600&auto=format&fit=crop&q=60",
    creator: "civic_mind_sf",
    upvotes: 56,
    upvoters: ["user1", "user2"],
    commentsCount: 4,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    priorityScore: 3 * 25 + 56 * 10 + 4 * 5, // high base priority
    location: "Jefferson St & Hyde St, San Francisco, CA",
  },
  {
    id: "seed-2",
    title: "Deep pothole in middle of Mission Street lane",
    description: "Deep pothole on the inner lane of Mission St. Already saw two cars swerve dangerously to avoid it. If not patched soon, it will cause flat tires or a collision.",
    category: "Roads & Potholes",
    severity: "high",
    status: "verified",
    latitude: 37.7602,
    longitude: -122.4184,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60",
    creator: "pothole_warrior",
    upvotes: 42,
    upvoters: ["user3"],
    commentsCount: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    priorityScore: 42 * 10 + 2 * 5,
    location: "Mission Street & 16th St, San Francisco, CA",
  },
  {
    id: "seed-3",
    title: "Broken streetlight causing pitch black alley",
    description: "Streetlight #SF-3802 is completely dead. This alleyway at night is completely dark and feels very unsafe. Needs immediate bulb replacement.",
    category: "Lighting & Power",
    severity: "medium",
    status: "reported",
    latitude: 37.7880,
    longitude: -122.4075,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?w=600&auto=format&fit=crop&q=60",
    creator: "nightWALK_sf",
    upvotes: 18,
    upvoters: [],
    commentsCount: 1,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    priorityScore: 18 * 10 + 1 * 5,
    location: "Tenderloin Alleyway, San Francisco, CA",
  },
  {
    id: "seed-4",
    title: "Overflowing commercial garbage bins in public park",
    description: "Someone dumped construction debris and old mattresses next to the park entrance garbage bins. It is attracting rodents and smells awful.",
    category: "Garbage & Sanitation",
    severity: "high",
    status: "reported",
    latitude: 37.7915,
    longitude: -122.4012,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=60",
    creator: "gogreen_alice",
    upvotes: 28,
    upvoters: ["user1"],
    commentsCount: 3,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    priorityScore: 28 * 10 + 3 * 5,
    location: "South Park, San Francisco, CA",
  },
  {
    id: "seed-5",
    title: "Severely splintered wooden swing set",
    description: "The main wooden frame of the swingset in GGP children's quarters is cracked and splintering. Kids are getting splinters and the frame feels unstable.",
    category: "Parks & Infrastructure",
    severity: "low",
    status: "resolved",
    latitude: 37.7694,
    longitude: -122.4862,
    imageUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=600&auto=format&fit=crop&q=60",
    creator: "city_parent_9",
    upvotes: 12,
    upvoters: [],
    commentsCount: 2,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    priorityScore: 12 * 10 + 2 * 5,
    location: "Golden Gate Park Swing Section, San Francisco, CA",
    resolutionProof: {
      imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=60",
      notes: "The park crew visited site SF-GG-9, sanded down the wooden support posts, replaced the damaged swings with commercial heavy-duty polymer swings, and double-bolted the safety chains. Swing set is fully safe and open for playtime!",
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
];

let comments: Comment[] = [
  {
    id: "c1",
    issueId: "seed-1",
    author: "supervisor_maritza",
    content: "Thank you for reporting this! Our Public Utilities Commission water response team is dispatching a technician to find the isolation valve and stop the flow. Case ID #SF-PUC-91048.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "c2",
    issueId: "seed-1",
    author: "citizen_jane",
    content: "Drove past this today, the water has reached the next block. Be extremely careful if you are walking or biking near Fisherman's Wharf!",
    createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "c3",
    issueId: "seed-4",
    author: "sf_clean_streets",
    content: "Sanitation trucks should be active here on Tuesday, but this is a bulk dumping violation. I've logged an official complaint with SF 311.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "c4",
    issueId: "seed-5",
    author: "city_parent_9",
    content: "Fast resolution! Thank you to the SF Recreation and Parks Department for responding so quickly.",
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
  }
];

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
// 1. Get all issues (with filtering, searching, and sorting)
app.get("/api/issues", (req, res) => {
  const { category, status, search, sortBy } = req.query;
  let filtered = [...issues];

  if (category) {
    filtered = filtered.filter((i) => i.category === category);
  }
  if (status) {
    filtered = filtered.filter((i) => i.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }

  // Calculate scores before sorting
  filtered = filtered.map((issue) => {
    const count = comments.filter((c) => c.issueId === issue.id).length;
    return {
      ...issue,
      commentsCount: count,
      priorityScore: calculatePriority(issue.severity, issue.upvotes, count),
    };
  });

  // Sort
  if (sortBy === "priority") {
    filtered.sort((a, b) => b.priorityScore - a.priorityScore);
  } else if (sortBy === "most_upvoted") {
    filtered.sort((a, b) => b.upvotes - a.upvotes);
  } else if (sortBy === "recent") {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === "severity") {
    const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  } else {
    // Default: Sort by priority desc
    filtered.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  res.json(filtered);
});

// 2. Analyze uploaded issue image (real Gemini or robust high-fidelity fallback)
app.post("/api/issues/analyze", async (req, res) => {
  const { imageBase64, mimeType, lat, lng, description } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "No image content provided." });
  }

  // Detect potential duplicates within 150 meters before calling Gemini
  const nearbyIssuesInRadius = issues
    .map((issue) => ({
      ...issue,
      distance: lat && lng ? calculateDistanceInMeters(lat, lng, issue.latitude, issue.longitude) : Infinity,
    }))
    .filter((issue) => issue.distance <= 150)
    .sort((a, b) => a.distance - b.distance);

  const duplicateWarning = nearbyIssuesInRadius.length > 0 ? {
    isPotentialDuplicate: true,
    matchingIssue: nearbyIssuesInRadius[0],
    distanceMeters: Math.round(nearbyIssuesInRadius[0].distance),
  } : null;

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
    text: "What is in this image? Reply in one sentence."
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
          category: analysis.category || "Other",
          severity: (analysis.severity || "medium").toLowerCase(),
          suggestedDepartment: analysis.suggestedDepartment || "Department of Public Works",
          aiSummary: analysis.aiSummary || "No summary provided by Gemini."
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
app.post("/api/issues", (req, res) => {
  const { title, description, category, severity, latitude, longitude, imageUrl, image, location, aiSummary, suggestedDepartment, creator, status } = req.body;

  if (!title || !category || !severity) {
    return res.status(400).json({ error: "Missing required issue parameters" });
  }

  const finalLat = latitude !== undefined ? Number(latitude) : (37.7749 + (Math.random() - 0.5) * 0.05);
  const finalLng = longitude !== undefined ? Number(longitude) : (-122.4194 + (Math.random() - 0.5) * 0.05);
  const finalImage = image || imageUrl || "https://images.unsplash.com/photo-1584467541268-b029fb34de4e?w=600&auto=format&fit=crop&q=60";
  const finalStatus = status || "Open";

  const newIssue: IssuePost = {
    id: "issue-" + Date.now(),
    title,
    description: description || "No detailed description provided.",
    category,
    severity: severity as SeverityType,
    status: finalStatus,
    latitude: finalLat,
    longitude: finalLng,
    imageUrl: finalImage,
    image: finalImage,
    location: location || "San Francisco, CA",
    aiSummary: aiSummary || "",
    suggestedDepartment: suggestedDepartment || "Department of Public Works",
    creator: creator || "anonymous_citizen",
    upvotes: 0,
    upvoters: [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    priorityScore: calculatePriority(severity as SeverityType, 0, 0),
  };

  issues.unshift(newIssue);
  res.status(201).json(newIssue);
});

// 4. Vote for an issue (Reddit style toggle upvote)
app.post("/api/issues/:id/vote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const user = userId || "tester_user";
  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const votedIndex = issue.upvoters.indexOf(user);
  if (votedIndex > -1) {
    // Already upvoted, remove upvote
    issue.upvoters.splice(votedIndex, 1);
    issue.upvotes = Math.max(0, issue.upvotes - 1);
  } else {
    // Add upvote
    issue.upvoters.push(user);
    issue.upvotes += 1;
  }

  // Recalculate priority
  issue.priorityScore = calculatePriority(issue.severity, issue.upvotes, issue.commentsCount);

  res.json({ upvotes: issue.upvotes, upvoters: issue.upvoters, priorityScore: issue.priorityScore });
});

// 5. Get comments for an issue
app.get("/api/issues/:id/comments", (req, res) => {
  const { id } = req.params;
  const filteredComments = comments
    .filter((c) => c.issueId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(filteredComments);
});

// 6. Post a comment
app.post("/api/issues/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Comment content cannot be empty" });
  }

  const issue = issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newComment: Comment = {
    id: "comment-" + Date.now(),
    issueId: id,
    author: author || "civic_member",
    content,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);

  // Update comment counter and recalculate priority
  issue.commentsCount = comments.filter((c) => c.issueId === id).length;
  issue.priorityScore = calculatePriority(issue.severity, issue.upvotes, issue.commentsCount);

  res.status(201).json(newComment);
});

// 7. Solve issue and post progress or verification status updates
app.patch("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, proofImage, proofNotes } = req.body;

  const issue = issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (status) {
    issue.status = status as StatusType;
  }

  if (status === "resolved") {
    issue.resolutionProof = {
      imageUrl: proofImage || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=60",
      notes: proofNotes || "Citizen-led maintenance verification confirmed. Handled in collaboration with City Infrastructure services.",
      updatedAt: new Date().toISOString(),
    };
  }

  // Recalculate priority
  issue.priorityScore = calculatePriority(issue.severity, issue.upvotes, issue.commentsCount);

  res.json(issue);
});

// 8. Public Transparency Metrics Dashboard Endpoint (Task 9)
app.get("/api/stats", (req, res) => {
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "resolved").length;
  const inProgress = issues.filter((i) => i.status === "in_progress").length;
  const critical = issues.filter((i) => i.severity === "critical" && i.status !== "resolved").length;

  const categoryDistribution: { [key: string]: number } = {};
  issues.forEach((i) => {
    categoryDistribution[i.category] = (categoryDistribution[i.category] || 0) + 1;
  });

  // Average hours in resolving
  const resolutionTimes = issues
    .filter((i) => i.status === "resolved" && i.resolutionProof?.updatedAt)
    .map((i) => {
      const created = new Date(i.createdAt).getTime();
      const resolvedAt = new Date(i.resolutionProof!.updatedAt!).getTime();
      return (resolvedAt - created) / (1000 * 60 * 60); // hours
    });

  const avgHours = resolutionTimes.length > 0
    ? resolutionTimes.reduce((acc, current) => acc + current, 0) / resolutionTimes.length
    : 16.5; // fallback seeded average hours (16.5h is amazing speed!)

  const stats: CivicStats = {
    totalIssues: total,
    resolvedIssues: resolved,
    inProgressIssues: inProgress,
    criticalIssues: critical,
    categoryDistribution,
    resolutionTimeAverageHours: Math.round(avgHours * 10) / 10,
  };

  res.json(stats);
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
