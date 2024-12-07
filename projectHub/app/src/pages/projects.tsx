import React, { useEffect, useState } from "react";
import ProjectList from "../components/projects/ProjectList";
import "../css/projects.css";
import axios from "axios";
import mockDocLinks from "../mocks/projects";

const Projects = () => {
  const [docLinks, setDocLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

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

  const handleProjectClick = (doc) => {
    console.log(`Setting chosen project...`);
    console.log(doc);

    setSelectedProject(doc);
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
          <iframe
            src={selectedProject.cloudFrontUrlIndexHtml}
            style={{ width: "100%", height: "100vh", border: "none" }}
            title={`${selectedProject.name} Documentation`}
          ></iframe>
        ) : (
          <div className="text-gray-700">
            <h3 className="text-2xl font-semibold mb-4">Welcome!</h3>
            <p className="mb-4">
              Select a project from the list on the left to view its
              documentation.
            </p>
            <p>
              Here, you’ll find detailed documentation for each project version.
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
    console.log("Fetching documentation links from the API.");
    const apiDocLinks = "/api/docLinks";

    try {
      const res = await axios.get(apiDocLinks);
      console.log(`Response from the API call`);
      console.log(res);

      return res.data;
    } catch (err) {
      console.error("Error retrieving data:", err);
      throw new Error("Failed to fetch data from the API");
    }
  }
}
