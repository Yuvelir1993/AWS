import express, { Request, Response } from "express";
import AWS from "aws-sdk";
import path from "path";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = ["https://your-frontend-domain.com"];
const TOKEN = "your-expected-token";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "eu-central-1",
});

app.use(
  cors({
    origin: (origin: any, callback: any) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.static(path.join(__dirname, "../build")));

app.get("/api/docLinks", async (req: Request, res: Response): Promise<void> => {
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
