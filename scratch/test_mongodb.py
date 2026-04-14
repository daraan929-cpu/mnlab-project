import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

async def test_conn():
    load_dotenv("backend/.env")
    url = os.getenv("MONGODB_URL")
    if not url:
        print("❌ MONGODB_URL not found in backend/.env")
        return
    print(f"Testing connection to: {url[:30]}...")
    client = motor.motor_asyncio.AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command('ping')
        print("SUCCESS: MongoDB connection successful!")
    except Exception as e:
        print(f"ERROR: MongoDB connection failed: {str(e)}")

asyncio.run(test_conn())
