import html
from pathlib import Path


class Validator:
    def __init__(self, extract_path: Path):
        self.extract_path = extract_path
        self.errors = []

    def validate(self) -> bool:
        """
        Runs all validation checks and returns True if all pass, False otherwise.
        """
        checks = [
            self._check_docs_folder_exists
        ]

        for check in checks:
            check()

        return len(self.errors) == 0

    def _check_docs_folder_exists(self):
        docs_path = self.extract_path / 'docs'
        if not docs_path.is_dir():
            self.errors.append("Missing 'docs' folder.")
        else:
            self.docs_path = docs_path

    def get_error_messages(self):
        return self.errors


def generate_error_index_html(error_messages: list) -> str:
    """
    Generates an error index.html content with the provided error messages.
    """
    escaped_messages = [html.escape(message) for message in error_messages]
    error_html = f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Validation Error</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f8d7da;
            color: #721c24;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 600px;
            margin: auto;
        }}
        h1 {{
            text-align: center;
        }}
        ul {{
            list-style-type: disc;
            margin-left: 20px;
        }}
        .rules {{
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            margin-top: 20px;
            border: 1px solid #ffeeba;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Validation Failed</h1>
        <p>The uploaded project did not pass the validation checks. Please address the following issues:</p>
        <ul>
            {''.join(f'<li>{message}</li>' for message in escaped_messages)}
        </ul>
        <div class="rules">
            <h2>Submission Rules:</h2>
            <ul>
                <li>The project must contain a <strong>'docs'</strong> folder.</li>
            </ul>
        </div>
    </div>
</body>
</html>"""
    return error_html
