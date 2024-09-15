import os
from flask import Flask, jsonify
app = Flask(__name__)

# TODO: parametrize
port = int(os.environ.get('PORT', 5000))


@app.route("/")
def home():
    return "Hello, this is an AWS S3 API service!"


@app.route("/health")
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Service is up and running!"
    }), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=port)
