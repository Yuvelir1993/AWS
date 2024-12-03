import express, { Request, Response } from "express";
import {
  GetObjectCommand,
  NoSuchKey,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 3000;
// const allowedOrigins = ["https://your-frontend-domain.com"];
const TOKEN = "your-expected-token";
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-central-1",
});

// app.use(
//   cors({
//     origin: (origin: any, callback: any) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//   })
// );

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
    const s3ClientResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: "project-hub-bucket-green",
        Key: "docLinks.json",
      })
    );

    const str = await s3ClientResponse.Body?.transformToString();
    console.log(`Retrieved 'docLinks.json' content: ${str}`);
    res.json(str);
  } catch (caught) {
    if (caught instanceof NoSuchKey) {
      console.error(
        `Error from S3 while getting docLinks.json from project-hub-bucket-green. No such key exists.`
      );
    } else if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while getting object from project-hub-bucket-green.  ${caught.name}: ${caught.message}`
      );
    } else {
      throw caught;
    }
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
