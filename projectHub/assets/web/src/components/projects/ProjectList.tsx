import React from "react";

const ProjectList = ({ docLinks, onSelectProject }) => {
  const groupedProjects = docLinks.reduce((acc, doc) => {
    if (!acc[doc.name]) {
      acc[doc.name] = [];
    }
    acc[doc.name].push(doc);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-lg mx-auto font-sans">
      <ul className="space-y-3">
        {Object.keys(groupedProjects).map((projectName) => {
          const versions = groupedProjects[projectName];
          return (
            <li key={projectName} className="list-none">
              {versions.length > 1 ? (
                // Render a dropdown if there are multiple versions
                <details className="p-2 bg-gray-100 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700">
                    {projectName}
                  </summary>
                  <ul className="ml-4 mt-2 space-y-1">
                    {versions.map((doc, index) => (
                      <li key={index}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProject(doc);
                          }}
                          className="text-blue-600 hover:underline hover:text-blue-800"
                        >
                          Version {doc.version}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                // Render a single link if there's only one version
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectProject(versions[0]);
                  }}
                  className="block p-2 bg-gray-100 rounded-lg font-semibold text-blue-600 hover:bg-gray-200"
                >
                  {projectName} - Version {versions[0].version}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProjectList;
