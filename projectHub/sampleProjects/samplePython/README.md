# General
Sample python project built with [FastAPI](https://fastapi.tiangolo.com/) to demonstrate API development with automatic documentation generation using `pdoc`.
Document code in restructuredtext.

## Requirements

- Python 3.12+
- FastAPI
- `uvicorn` for running the development server
- `pdoc` for generating API documentation

## Setup and Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. **Generate docs**:
    ```bash
    poetry run pdoc ./sample_python --output-dir ./docs
    ```