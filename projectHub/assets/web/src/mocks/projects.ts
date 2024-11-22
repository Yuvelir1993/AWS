type DocLink = {
  name: string;
  version: string;
  url: string;
  readmeUrl: string;
  readmeMockData: string;
};

const mockDocLinks: DocLink[] = [
  {
    name: "PythonApp",
    version: "1.0.0",
    url: "http://s3/docs/index.html",
    readmeUrl: "https://your-cloudfront-url/PythonApp-1.0.0/README.md",
    readmeMockData: `
  # PythonApp
  
  Welcome to **PythonApp** documentation of version 1.0.0!
  
  ## Overview
  
  PythonApp is a Python-based application designed to demonstrate various capabilities of Python.
  
  ### Features
  
  - Easy to use
  - Highly scalable
  - Cross-platform support
  
  ## Installation
  
  To install PythonApp, run:
  
  \`\`\`bash
  pip install pythonapp
  \`\`\`
  
  ## Usage
  
  After installation, you can use the app with the following command:
  
  \`\`\`python
  import pythonapp
  pythonapp.run()
  \`\`\`
  
  ## License
  
  This project is licensed under the MIT License.
      `,
  },
  {
    name: "PythonApp",
    version: "1.1.0",
    url: "http://s3/docs/index.html",
    readmeUrl: "https://your-cloudfront-url/PythonApp-1.0.0/README.md",
    readmeMockData: `
  # PythonApp
  
  Welcome to **PythonApp** documentation of version 1.1.0!
  
  ## Overview
  
  PythonApp is a Python-based application designed to demonstrate various capabilities of Python.
  
  ### Features
  
  - Easy to use
  - Highly scalable
  - Cross-platform support
  
  ## Installation
  
  To install PythonApp, run:
  
  \`\`\`bash
  pip install pythonapp
  \`\`\`
  
  ## Usage
  
  After installation, you can use the app with the following command:
  
  \`\`\`python
  import pythonapp
  pythonapp.run()
  \`\`\`
  
  ## License
  
  This project is licensed under the MIT License.
      `,
  },
  {
    name: "PythonApp",
    version: "2.0.0",
    url: "http://s3/docs/index.html",
    readmeUrl: "https://your-cloudfront-url/PythonApp-1.0.0/README.md",
    readmeMockData: `
  # PythonApp
  
  Welcome to **PythonApp** documentation of version 2.0.0!
  
  ## Overview
  
  PythonApp is a Python-based application designed to demonstrate various capabilities of Python.
  
  ### Features
  
  - Easy to use
  - Highly scalable
  - Cross-platform support
  
  ## Installation
  
  To install PythonApp, run:
  
  \`\`\`bash
  pip install pythonapp
  \`\`\`
  
  ## Usage
  
  After installation, you can use the app with the following command:
  
  \`\`\`python
  import pythonapp
  pythonapp.run()
  \`\`\`
  
  ## License
  
  This project is licensed under the MIT License.
      `,
  },
  {
    name: "GolangApp",
    version: "1.0.0",
    url: "http://s3/docs/index.html",
    readmeUrl: "https://your-cloudfront-url/GolangApp-2.0.0/README.md",
    readmeMockData: `
  # GolangApp
  
  **GolangApp** is a high-performance application written in Go.
  
  ### Table of Contents
  
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Features](#features)
  
  ## Installation
  
  Install via Go command:
  
  \`\`\`bash
  go get github.com/example/golangapp
  \`\`\`
  
  ## Quick Start
  
  1. Import the package:
      \`\`\`go
      import "github.com/example/golangapp"
      \`\`\`
  
  2. Initialize and run:
  
      \`\`\`go
      app := golangapp.New()
      app.Run()
      \`\`\`
  
  ## Features
  
  | Feature           | Description               |
  |-------------------|---------------------------|
  | High Performance  | Optimized for speed       |
  | Lightweight       | Minimal memory usage      |
  | Scalable          | Easily handles load       |
      `,
  },
  {
    name: "JavaApp",
    version: "1.1.0",
    url: "http://s3/docs/index.html",
    readmeUrl: "https://your-cloudfront-url/JavaApp-1.1.0/README.md",
    readmeMockData: `
  # JavaApp
  
  JavaApp is an enterprise-grade application written in Java.
  
  ## Prerequisites
  
  - Java 11 or higher
  - Maven 3.6 or higher
  
  ## Building the Project
  
  Run the following commands to build the project:
  
  \`\`\`bash
  mvn clean install
  \`\`\`
  
  ## Running Tests
  
  To run tests:
  
  \`\`\`bash
  mvn test
  \`\`\`
  
  ## Configuration
  
  Update the \`application.properties\` file:
  
  \`\`\`properties
  app.environment=production
  app.debug=false
  \`\`\`
  
  ## Contributing
  
  Feel free to submit pull requests or open issues.
      `,
  },
  {
    name: "TsApp",
    version: "5.0.0",
    url: "http://s3/docs/index.html",
    readmeUrl: "https://your-cloudfront-url/TsApp-5.0.0/README.md",
    readmeMockData: `
  # TsApp
  
  Welcome to **TsApp** documentation, a TypeScript-based application.
  
  ## Installation
  
  \`\`\`bash
  npm install -g tsapp
  \`\`\`
  
  ## Usage
  
  After installation, run:
  
  \`\`\`bash
  tsapp start
  \`\`\`
  
  ### CLI Options
  
  | Option         | Description               |
  |----------------|---------------------------|
  | \`--help\`       | Show help information     |
  | \`--version\`    | Display version           |
  | \`--config <path>\` | Specify config file path |
  
  ## Example Config File
  
  \`\`\`json
  {
    "setting1": true,
    "setting2": "value"
  }
  \`\`\`
  
  ## License
  
  Distributed under the Apache 2.0 License. See \`LICENSE\` for more information.
      `,
  },
];

export default mockDocLinks;
