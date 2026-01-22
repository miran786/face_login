import os
import shutil
import base64
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
import cv2
import numpy as np
import uuid

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path suitable for DeepFace
DB_PATH = "face_db"

if not os.path.exists(DB_PATH):
    os.makedirs(DB_PATH)

class VerifyRequest(BaseModel):
    image: str # Base64 string

class RegisterRequest(BaseModel):
    image: str # Base64 string
    email: str

def base64_to_image(base64_string):
    try:
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
        
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

@app.get("/")
def read_root():
    return {"status": "Face Recognition Server Running"}

@app.post("/verify")
async def verify_face(request: VerifyRequest):
    """
    Verifies the uploaded face against the database.
    Returns the user ID (email) if matched, else 'unknown'.
    """
    try:
        # Save temp image for processing
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        img = base64_to_image(request.image)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
            
        cv2.imwrite(temp_filename, img)

        print("Received verification request...")
        
        try:
            # DeepFace find returns a list of dataframes
            # We use VGG-Face model by default, it's a good balance.
            # enforce_detection=False allows verifying even if face detection is tricky (optional)
            dfs = DeepFace.find(
                img_path=temp_filename, 
                db_path=DB_PATH, 
                model_name="VGG-Face",
                distance_metric="cosine",
                enforce_detection=False,
                silent=True
            )
            
            # Cleanup temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

            if len(dfs) > 0 and len(dfs[0]) > 0:
                # Get the best match
                matched_identity = dfs[0].iloc[0]["identity"]
                distance = float(dfs[0].iloc[0]["distance"])
                print(f"Match found! Identity: {matched_identity}, Distance: {distance}")
                
                # Normalize path separators
                matched_identity = matched_identity.replace("\\", "/")
                parts = matched_identity.split("/")
                
                # Assuming structure face_db/{email}/{image}
                if len(parts) >= 2:
                    email = parts[-2]
                    return {"status": "success", "user": email, "distance": distance}
            
            print("No match found.")
            return {"status": "failed", "message": "No match found"}

        except Exception as e:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            print(f"DeepFace processing error: {e}")
            return {"status": "failed", "message": str(e)}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/register")
async def register_face(request: RegisterRequest):
    """
    Registers a new user face.
    Creates a folder face_db/{email} and saves the image there.
    """
    try:
        user_folder = os.path.join(DB_PATH, request.email)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)
        
        # Save image
        img_path = os.path.join(user_folder, "face.jpg")
        img = base64_to_image(request.image)
        
        if img is None:
             raise HTTPException(status_code=400, detail="Invalid image data")

        cv2.imwrite(img_path, img)
        
        # Determine representation path to clear cache
        # DeepFace creates a .pkl file in the db_path to cache embeddings
        # We should delete it to force re-indexing
        pkl_path = os.path.join(DB_PATH, f"representations_vgg_face.pkl")
        if os.path.exists(pkl_path):
            os.remove(pkl_path)
            
        return {"status": "success", "message": f"User {request.email} registered"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
