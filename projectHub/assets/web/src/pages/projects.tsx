// src/pages/Projects.tsx
import React, { useEffect, useState } from "react";
import ProjectList from "../components/projects/ProjectList";
import ProjectReadme from "../components/projects/ProjectReadme";
import mockDocLinks from "../mocks/projects";

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
    <div>
      <ProjectList docLinks={docLinks} onSelectProject={handleProjectClick} />
      {selectedProject && (
        <ProjectReadme
          selectedProject={selectedProject}
          readmeContent={readmeContent}
          readmeLoading={readmeLoading}
        />
      )}
    </div>
  );
};

export default Projects;

async function getDocLinksData() {
  if (process.env.NODE_ENV && process.env.NODE_ENV.indexOf("dev") > -1) {
    console.log("Using mock data for development");
    return mockDocLinks; // Return mock data
  } else {
    const jsonUrl = "https://your-cloudfront-url/docLinks.json";
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch doc links");
    }
    const data = await response.json();
    return data;
  }
}
