import express, { Request, Response } from "express";
import {
  GetObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

interface DocLink {
  name: string;
  version: string;
  urlIndexHtml: string;
  urlReadme: string;
  cloudFrontUrlIndexHtml?: string;
  cloudFrontUrlReadme?: string;
}

const app = express();
const port = process.env.PORT || 3000;
// const allowedOrigins = ["https://your-frontend-domain.com"];
const TOKEN = "your-expected-token";
const bucketName = "project-hub-bucket-green";
const docLinksJson = "docLinks.json";
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-central-1",
});

const cloudFrontBaseUrl = process.env.CLOUD_FRONT_BASE_URL;

console.log(`CloudFront Base URL: ${cloudFrontBaseUrl}, port: ${port}`);

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
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: docLinksJson,
    });

    const s3ClientResponse = await s3Client.send(getObjectCommand);
    const str = await s3ClientResponse.Body?.transformToString();
    console.log(`Retrieved '${docLinksJson}' content: ${str}`);

    const docLinks: DocLink[] = JSON.parse(str!);

    await Promise.all(
      docLinks.map(async (doc) => {
        const indexOfProjectsIndexHtml = doc.urlIndexHtml.indexOf("/projects");
        const indexOfProjectsReadme = doc.urlReadme.indexOf("/projects");

        if (indexOfProjectsIndexHtml !== -1) {
          // Extract everything after "/projects"
          const relativePathIndexHtml = doc.urlIndexHtml.substring(
            indexOfProjectsIndexHtml
          );
          // Prepend the CloudFront base URL
          doc.cloudFrontUrlIndexHtml = `${cloudFrontBaseUrl}${relativePathIndexHtml}`;
        } else {
          // Fallback: If for some reason "/projects" is not found, default to the original URL
          doc.cloudFrontUrlIndexHtml = doc.urlIndexHtml;
        }

        if (indexOfProjectsReadme !== -1) {
          const relativePathReadme = doc.urlReadme.substring(
            indexOfProjectsReadme
          );
          doc.cloudFrontUrlReadme = `${cloudFrontBaseUrl}${relativePathReadme}`;
        } else {
          doc.cloudFrontUrlReadme = doc.urlReadme;
        }
      })
    );

    res.json(docLinks);
  } catch (caught) {
    if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while getting '${docLinksJson}' from ${bucketName}. ${caught.name}: ${caught.message}`
      );
      res.status(500).send(`Error retrieving '${docLinksJson}' from S3`);
    } else {
      console.error("Unexpected error:", caught);
      res.status(500).send("An unexpected error occurred");
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
