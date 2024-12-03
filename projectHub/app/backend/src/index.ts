import express, { Request, Response } from "express";
import {
  GetObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface DocLink {
  name: string;
  version: string;
  urlIndexHtml: string;
  urlReadme: string;
  // We will add the signed URLs as new properties
  signedUrlIndexHtml?: string;
  signedUrlReadme?: string;
}

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
  try {
    // Step 1: Retrieve 'docLinks.json' from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: "project-hub-bucket-green",
      Key: "docLinks.json",
    });

    const s3ClientResponse = await s3Client.send(getObjectCommand);

    // Step 2: Parse the content into an array of DocLink objects
    const str = await s3ClientResponse.Body?.transformToString();
    console.log(`Retrieved 'docLinks.json' content: ${str}`);

    const docLinks: DocLink[] = JSON.parse(str!);

    // Step 3: For each DocLink, generate signed URLs
    await Promise.all(
      docLinks.map(async (doc) => {
        // Extract the bucket name and key from the URLs or reconstruct them
        const bucketName = "project-hub-bucket-green";

        // Assuming the S3 object keys follow a consistent pattern
        const indexKey = `projects/projects/${doc.name}-${doc.version}/docs/index.html`;
        const readmeKey = `projects/projects/${doc.name}-${doc.version}/README.md`; // Adjust the path if necessary

        // Create commands for the GetObject operation
        const indexCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: indexKey,
        });

        const readmeCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: readmeKey,
        });

        try {
          // Generate signed URLs for both index.html and README.md
          const signedIndexUrl = await getSignedUrl(s3Client, indexCommand, {
            expiresIn: 3600,
          });
          const signedReadmeUrl = await getSignedUrl(s3Client, readmeCommand, {
            expiresIn: 3600,
          });

          // Step 4: Append the signed URLs to the doc object
          doc.signedUrlIndexHtml = signedIndexUrl;
          doc.signedUrlReadme = signedReadmeUrl;
        } catch (error) {
          console.error(
            `Error generating signed URLs for ${doc.name}-${doc.version}:`,
            error
          );
          // Handle errors as needed (e.g., set signed URLs to null or default values)
          doc.signedUrlIndexHtml = "";
          doc.signedUrlReadme = "";
        }
      })
    );

    // Step 5: Return the modified array
    res.json(docLinks);
  } catch (caught) {
    if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while getting 'docLinks.json' from project-hub-bucket-green. ${caught.name}: ${caught.message}`
      );
      res.status(500).send("Error retrieving 'docLinks.json' from S3");
    } else {
      console.error("Unexpected error:", caught);
      res.status(500).send("An unexpected error occurred");
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
