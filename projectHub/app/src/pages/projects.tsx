import React, { useEffect, useState } from "react";
import ProjectList from "../components/projects/ProjectList";
import ProjectReadme from "../components/projects/ProjectReadme";
import mockDocLinks from "../mocks/projects";
import "../css/projects.css";
import axios from "axios";

const Projects = () => {
  const [docLinks, setDocLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [readmeContent, setReadmeContent] = useState("");
  const [readmeLoading, setReadmeLoading] = useState(false);

  useEffect(() => {
    const fetchDocLinks = async () => {
      try {
        const data = await getDocLinksData();
        setDocLinks(data);
      } catch (error) {
        console.error("Error fetching docLinks.json:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocLinks();
  }, []);

  const handleProjectClick = async (doc) => {
    setSelectedProject(doc);
    setReadmeLoading(true);
    try {
      let content = "";
      if (process.env.NODE_ENV && process.env.NODE_ENV.indexOf("dev") > -1) {
        content = doc.readmeMockData || "Mock README content not available.";
      } else {
        const response = await fetch(doc.readmeUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch README.md");
        }
        content = await response.text();
      }
      setReadmeContent(content);
    } catch (error) {
      console.error("Error fetching README.md:", error);
      setReadmeContent("Error loading README.md content.");
    } finally {
      setReadmeLoading(false);
    }
  };

  if (loading) return <p>Loading documentation links...</p>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 p-4 border-r border-gray-300">
        <ProjectList docLinks={docLinks} onSelectProject={handleProjectClick} />
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6">
        {selectedProject ? (
          <ProjectReadme
            selectedProject={selectedProject}
            readmeContent={readmeContent}
            readmeLoading={readmeLoading}
          />
        ) : (
          <div className="text-gray-700">
            <h3 className="text-2xl font-semibold mb-4">Welcome!</h3>
            <p className="mb-4">
              Select a project from the list on the left to view its
              documentation.
            </p>
            <p>
              Here, you’ll find detailed README files and other documentation
              for each project version.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;

async function getDocLinksData() {
  if (process.env.NODE_ENV && process.env.NODE_ENV.indexOf("dev") > -1) {
    console.log("Using mock data for development...");
    return mockDocLinks;
  } else {
    console.log("Fetching documentation urls from S3.");
    // const apiDocLinks = "api/docLinks";
    const apiDocLinks = "/api/docLinks";
    // const token = document
    //   .querySelector('meta[name="api-token"]')
    //   .getAttribute("content");

    // console.log(
    //   `The public token ${token} will be used to communicate with backend.`
    // );

    try {
      const res = await axios.get(apiDocLinks, {
        // headers: {
        //   "X-API-Token": token,
        // },
      });

      console.log("Data retrieved from API", res);
      return res.data;
    } catch (err) {
      console.error("Error retrieving data:", err);
      throw new Error("Failed to fetch data from the API");
    }
  }
}
