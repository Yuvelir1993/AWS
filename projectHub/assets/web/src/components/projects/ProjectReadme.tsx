// src/components/ProjectReadme.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ProjectReadme = ({ selectedProject, readmeContent, readmeLoading }) => (
  <div>
    <h3>
      {selectedProject.name} - {selectedProject.version} README
    </h3>
    {readmeLoading ? (
      <p>Loading README...</p>
    ) : (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown>
    )}
  </div>
);

export default ProjectReadme;
