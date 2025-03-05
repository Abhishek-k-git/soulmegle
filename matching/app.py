import os
import time
from flask import Flask, request, jsonify
import numpy as np
from flask_cors import CORS
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("SOCKET_SERVICE_URL")}})

# Polling settings
POLLING_INTERVAL = 3  # Every 3 seconds
MAX_ATTEMPTS = 10     # Try for 30 seconds

def pad_or_trim_vector(vector, target_length):
    """Ensure all vectors have the same length by padding with zeros or trimming."""
    vector = np.array(vector, dtype=np.float32)  # Ensure valid numeric data
    if len(vector) < target_length:
        return np.pad(vector, (0, target_length - len(vector)), mode="constant")
    return vector[:target_length]

@app.route("/api/match", methods=["POST"])
def find_match():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        current_user = data.get("currentUser")
        other_users = data.get("otherUsers", [])

        if not current_user or "userId" not in current_user or "interestVector" not in current_user:
            return jsonify({"error": "Invalid currentUser data"}), 400

        if not other_users:
            return jsonify({"message": "No users available for matching"}), 404
        
        current_vector = np.array(current_user["interestVector"], dtype=np.float32)
        max_vector_length = max(len(current_vector), *(len(user.get("interestVector", [])) for user in other_users))
        current_vector = pad_or_trim_vector(current_vector, max_vector_length).reshape(1, -1)

        best_match = None
        best_score = -1
        
        for user in other_users:
            user_vector = user.get("interestVector")
            if not isinstance(user_vector, list) or not all(isinstance(i, (int, float)) for i in user_vector):
                continue
            
            user_vector = pad_or_trim_vector(user_vector, max_vector_length).reshape(1, -1)
            similarity_score = cosine_similarity(current_vector, user_vector)[0][0]
            matched_interests = list(set(current_user["interests"]) & set(user.get("interests", [])))
            
            if similarity_score > best_score:
                best_score = similarity_score
                best_match = {
                    "matched_user_id": user["userId"],
                    "similarity_score": float(best_score),
                    "matched_user_interests": matched_interests
                }

        if best_match:
            return jsonify(best_match)
        
        return jsonify({"message": "No suitable match found"}), 404

    except Exception as e:
        print(f"Error in /api/match: {e}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route("/")
def root():
    return "soulmegle Matching Service is Running!"

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    host = os.getenv("HOST", "0.0.0.0")
    app.run(host=host, port=port)
