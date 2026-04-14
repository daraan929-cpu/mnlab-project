from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import json
import os
import shutil
import datetime
from backend.models import AdvancedVisionSystem2026, SecureFaceVerification, HomeMixerX
from backend.database import StorageManager
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MNLAB Advanced Vision System API", version="1.0.0")

storage = StorageManager()

# CORS Support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files will be handled by the root mount below to avoid redundancy

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_FILE = os.path.join(BACKEND_DIR, "settings.json")

async def verify_admin(x_admin_password: str = Header(None)):
    settings = await storage.get_settings()
    admin_data = settings.get("admin", {})
    stored_pass = admin_data.get("password_hash") or "admin123"
    
    if x_admin_password != stored_pass:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

# Initialize models
vision_system = AdvancedVisionSystem2026()
face_verification = SecureFaceVerification()
home_mixer = HomeMixerX()

@app.post("/api/v1/analyze_scene")
async def analyze_scene(file: UploadFile = File(...)):
    """
    Analyzes an uploaded image using YOLOv9, EfficientNetV3, and Privacy-Preserving FaceNet.
    Outputs the objects detected, scene understanding, and spatial map.
    """
    content = await file.read()
    # In a real scenario, convert 'content' to an image tensor
    results = vision_system.analyze_scene(content)
    return {"status": "success", "data": results}

@app.post("/api/v1/verify_identity")
async def verify_identity(
    claimed_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Verifies identity using Zero-Knowledge Proofs (ZKP) and AI Proof Protocol (AIP).
    """
    content = await file.read()
    is_valid, proof = face_verification.verify_identity(content, claimed_id)
    return {
        "status": "success",
        "verified": is_valid,
        "proof_details": proof,
        "protocol": "AIP / ZKP"
    }

@app.get("/api/v1/recommend_models")
async def recommend_models(user_id: str = "anonymous_user"):
    """
    Simulates the X Algorithm (Phoenix Retrieval + Grok Scoring + Thunder)
    to recommend 3D printing components to the user.
    """
    feed_data = home_mixer.get_for_you_feed(user_id)
    return {
        "status": "success",
        "data": feed_data
    }

# --- Local Network IP for QR Codes ---
import socket

@app.get("/api/v1/local-ip")
async def get_local_ip():
    """Returns the local network IP so QR codes can point to the correct address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except:
        ip = "127.0.0.1"
    return {"ip": ip, "port": 8000, "url": f"http://{ip}:8000"}

# --- Admin Endpoints ---

DEFAULT_SETTINGS = {
    "colors": {
        "--bg-main": "#0a0a0f",
        "--accent-1": "#00f2fe",
        "--accent-2": "#4facfe",
        "--accent-3": "#8a2be2"
    },
    "content": {
        "contact_phone": "967737214666",
        "contact_email": "info@mnlab.com",
        "hero_title": "مستقبل التصنيع الرقمي في اليمن",
        "hero_subtitle": "نحول أفكارك إلى واقع ملموس بتقنيات الطباعة ثلاثية الأبعاد الأكثر تطوراً."
    },
    "images": {
        "hero_image": "hero.png",
        "gallery": ["gallery4.jpg", "gallery5.jpg", "gallery6.jpg", "gallery7.jpg", "gallery8.jpg", "gallery9.jpg"]
    },
    "materials": [
        {"name": "PLA", "description": "سهل الاستخدام ومثالي للنماذج الجمالية."},
        {"name": "PETG", "description": "قوي ومقاوم للحرارة، مناسب للأجزاء الميكانيكية."}
    ]
}

@app.get("/api/v1/settings")
async def get_site_settings():
    """Returns the current site settings (public) with fallbacks"""
    settings = await storage.get_settings()
    
    # Deep merge with defaults
    final_settings = DEFAULT_SETTINGS.copy()
    for key in ["colors", "content", "images"]:
        if key in settings and isinstance(settings[key], dict):
            final_settings[key].update(settings[key])
    
    if "materials" in settings and isinstance(settings["materials"], list) and len(settings["materials"]) > 0:
        final_settings["materials"] = settings["materials"]
    else:
        final_settings["materials"] = DEFAULT_SETTINGS["materials"]

    # Safely remove sensitive info
    public_settings = {k: v for k, v in final_settings.items() if k != "admin"}
    
    # Fallback to Environment Variable for GOOGLE_API_KEY
    if not public_settings.get("content", {}).get("gemini_api_key"):
        env_key = os.getenv("GOOGLE_API_KEY")
        if env_key:
            public_settings["content"]["gemini_api_key"] = env_key
            
    return public_settings

@app.post("/api/v1/settings")
async def update_site_settings(new_settings: Dict[str, Any], authenticated: bool = Depends(verify_admin)):
    """Updates the site settings (protected)"""
    current_settings = await storage.get_settings()
    
    # Ensure keys exist
    for key in ["colors", "content", "images"]:
        if key not in current_settings:
            current_settings[key] = {}
    if "materials" not in current_settings:
        current_settings["materials"] = []
            
    # Merge settings
    if "colors" in new_settings:
        current_settings["colors"].update(new_settings["colors"])
    if "content" in new_settings:
        current_settings["content"].update(new_settings["content"])
    if "images" in new_settings:
        current_settings["images"].update(new_settings["images"])
    if "materials" in new_settings:
        current_settings["materials"] = new_settings["materials"]
    
    await storage.save_settings(current_settings)
    return {"status": "success", "message": "Settings updated"}

@app.post("/api/v1/upload")
async def upload_site_image(
    file: UploadFile = File(...), 
    target: str = Form(...), 
    authenticated: bool = Depends(verify_admin)
):
    """Uploads an image to MongoDB (Production) or local storage (Dev)"""
    content = await file.read()
    
    # Save the actual image data using the storage manager
    # This will return a Data URI if using MongoDB, or a filename if local
    image_url = await storage.save_image(target, content, file.content_type)
    
    # Fallback: if we are in local mode, still save the file to disk for immediate preview
    if not storage.use_mongodb:
        filename = f"{target}.png"
        file_path = os.path.join(BASE_DIR, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        image_url = filename

    # Update settings
    settings = await storage.get_settings()
    if "images" not in settings:
        settings["images"] = {"hero_image": "", "gallery": []}
        
    if target == "hero":
        settings["images"]["hero_image"] = image_url
    elif target.startswith("gallery"):
        if "gallery" not in settings["images"] or not isinstance(settings["images"]["gallery"], list):
            settings["images"]["gallery"] = []
        
        # Add to gallery (simple logic)
        if image_url not in settings["images"]["gallery"]:
             settings["images"]["gallery"].append(image_url)
             
    await storage.save_settings(settings)
    
    return {"status": "success", "url": image_url}

# --- Order Management System ---
@app.post("/api/v1/orders")
async def create_new_order(
    customer_name: str = Form("عميل من الموقع"),
    service_type: str = Form(""),
    details: str = Form(""),
    file: UploadFile = File(None)
):
    """Saves a new 3D printing order with optional file upload"""
    order_id = str(datetime.datetime.now().timestamp()).replace('.', '')
    file_path = None
    
    if file:
        content = await file.read()
        file_path = await storage.save_order_file(order_id, content, file.filename)
        
    order = {
        "id": order_id,
        "customer_name": customer_name,
        "service_type": service_type,
        "details": details,
        "design_file": file_path,
        "status": "pending"
    }
    
    saved_id = await storage.add_order(order)
    return {"status": "success", "order_id": saved_id}

@app.get("/api/v1/order-file/{order_id}")
async def download_order_file(order_id: str):
    """Serves the uploaded design file for an order"""
    if storage.use_mongodb:
        file_data = await storage.db.order_files.find_one({"order_id": order_id})
        if not file_data:
             raise HTTPException(status_code=404, detail="الملف غير موجود")
        
        import base64
        # Extract base64 from data URI
        data_uri = file_data["data_uri"]
        header, encoded = data_uri.split(",", 1)
        content = base64.b64decode(encoded)
        
        from fastapi.responses import Response
        return Response(content=content, media_type="application/octet-stream", headers={
            "Content-Disposition": f"attachment; filename={file_data['filename']}"
        })
    else:
        order = await storage.get_order_by_id(order_id)
        if not order or not order.get("design_file"):
            raise HTTPException(status_code=404, detail="الملف غير موجود")
        
        file_path = os.path.join(os.path.dirname(storage.orders_file), order["design_file"])
        if os.path.exists(file_path):
            from fastapi.responses import FileResponse
            return FileResponse(path=file_path, filename=order["design_file"].replace(f"order_{order_id}_", ""))
        
    raise HTTPException(status_code=404, detail="الملف غير موجود")


@app.get("/api/v1/orders/{order_id}")
async def fetch_order_status(order_id: str):
    """Retrieves order status by ID"""
    order = await storage.get_order_by_id(order_id)
    if order:
        return order
    raise HTTPException(status_code=404, detail="الطلب غير موجود")

@app.get("/api/v1/admin/orders")
async def admin_list_orders(auth: bool = Depends(verify_admin)):
    """Lists all orders for admin"""
    return await storage.get_orders()

@app.post("/api/v1/admin/orders/update")
async def admin_update_order_status(update_data: dict, auth: bool = Depends(verify_admin)):
    """Updates status or details of an order"""
    order_id = update_data.get("id")
    if not order_id:
        raise HTTPException(status_code=400, detail="Missing ID")
    
    success = await storage.update_order(order_id, {k: v for k, v in update_data.items() if k != "id"})
    if success:
        return {"status": "success", "message": "Order updated"}
    raise HTTPException(status_code=404, detail="Order not found")

# Serve the frontend statically from the root directory
app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
