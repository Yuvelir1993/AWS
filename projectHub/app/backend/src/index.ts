import express, { Request, Response } from "express";
import {
  S3Client,
  GetObjectCommand,
  GetObjectRequest,
} from "@aws-sdk/client-s3";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = ["https://your-frontend-domain.com"];
const TOKEN = "your-expected-token";
const s3Client = new S3Client({
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

// app.use((req, res, next) => {
//   if (req.url === "/index.html" || req.url === "/") {
//     const filePath = path.join(__dirname, "../build/index.html");
//     fs.readFile(filePath, "utf8", (err, data) => {
//       if (err) {
//         console.error("Failed to read HTML file:", err);
//         res.status(500).send("Server error");
//         return;
//       }

//       const injectedHtml = data.replace(
//         "</head>",
//         `<meta name="api-token" content="${TOKEN}" /></head>`
//       );
//       res.set("Content-Type", "text/html");
//       res.send(injectedHtml);
//     });
//   } else {
//     next();
//   }
// });

app.use(express.static("../build"));

app.get("/api/docLinks", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-api-token"] as string;
  // if (!token || token !== TOKEN) {
  //   // TODO: try 'render' to show appropriate page
  //   res.status(403).send("Forbidden");
  //   return;
  // }

  try {
    const input: GetObjectRequest = {
      Bucket: process.env.S3_BUCKET_NAME || "project-hub-bucket-green",
      Key: "docLinks.json",
    };
    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    const jsonContent = response.Body?.transformToString();
    res.json(jsonContent);
  } catch (error) {
    console.error("S3 Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
