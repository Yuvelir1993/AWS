import express, { Request, Response } from "express";
import AWS from "aws-sdk";
import path from "path";
import cors from "cors";

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Replace with your actual frontend domain
const allowedOrigins = ["https://your-frontend-domain.com"];
const TOKEN = "your-expected-token";

// AWS S3 Configuration
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "eu-central-1",
  // Credentials are not needed if using IAM roles on EC2
});

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Serve static files from the Docusaurus build directory
app.use(express.static(path.join(__dirname, "../build")));

// API endpoint to fetch data from S3
app.get("/api/doclinks", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-api-token"] as string;
  if (!token || token !== TOKEN) {
    res.status(403).send("Forbidden");
    return;
  }

  const params: AWS.S3.GetObjectRequest = {
    Bucket: process.env.S3_BUCKET_NAME || "",
    Key: "docLinks.json",
  };

  try {
    const data = await s3.getObject(params).promise();
    const jsonContent = JSON.parse(data.Body!.toString("utf-8"));
    res.json(jsonContent);
  } catch (error) {
    console.error("S3 Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Function to generate the token (implement your logic here)
function generateToken(): string {
  // Example: generate a random string or use JWT
  return TOKEN;
}

// Catch-al
