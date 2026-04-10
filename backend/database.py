import os
import json
import motor.motor_asyncio
from bson import ObjectId
from typing import Dict, Any, List
import datetime

class StorageManager:
    def __init__(self):
        self.use_mongodb = os.getenv("MONGODB_URL") is not None
        self.db = None
        if self.use_mongodb:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL"))
            self.db = self.client.get_database("mnlab_db")
            print("Using MongoDB for storage")
        else:
            print("Using local JSON for storage")
            self.base_dir = os.path.dirname(os.path.abspath(__file__))
            self.settings_file = os.path.join(self.base_dir, "settings.json")
            self.orders_file = os.path.join(self.base_dir, "orders.json")

    # --- Settings ---
    async def get_settings(self) -> Dict[str, Any]:
        if self.use_mongodb:
            settings = await self.db.settings.find_one({"type": "site_settings"})
            if not settings:
                return {}
            settings.pop("_id", None)
            return settings
        else:
            if not os.path.exists(self.settings_file):
                return {}
            with open(self.settings_file, "r", encoding="utf-8") as f:
                return json.load(f)

    async def save_settings(self, settings: Dict[str, Any]):
        if self.use_mongodb:
            settings["type"] = "site_settings"
            await self.db.settings.update_one(
                {"type": "site_settings"},
                {"$set": settings},
                upsert=True
            )
        else:
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=4, ensure_ascii=False)

    # --- Orders ---
    async def get_orders(self) -> List[Dict[str, Any]]:
        if self.use_mongodb:
            cursor = self.db.orders.find().sort("timestamp", -1)
            orders = await cursor.to_list(length=1000)
            for o in orders:
                o["_id"] = str(o["_id"])
            return orders
        else:
            if not os.path.exists(self.orders_file):
                return []
            with open(self.orders_file, "r", encoding="utf-8") as f:
                try:
                    return json.load(f)
                except:
                    return []

    async def add_order(self, order: Dict[str, Any]) -> str:
        # Generate ID
        now = datetime.datetime.now()
        
        if self.use_mongodb:
            count = await self.db.orders.count_documents({})
            order_id = f"MN-{now.strftime('%y%m%d')}-{count + 1:03d}"
            order["id"] = order_id
            order["timestamp"] = now.isoformat()
            await self.db.orders.insert_one(order)
            return order_id
        else:
            orders = await self.get_orders()
            order_id = f"MN-{now.strftime('%y%m%d')}-{len(orders) + 1:03d}"
            order["id"] = order_id
            order["timestamp"] = now.isoformat()
            orders.append(order)
            with open(self.orders_file, "w", encoding="utf-8") as f:
                json.dump(orders, f, ensure_ascii=False, indent=4)
            return order_id

    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> bool:
        if self.use_mongodb:
            result = await self.db.orders.update_one({"id": order_id}, {"$set": update_data})
            return result.modified_count > 0
        else:
            orders = await self.get_orders()
            for o in orders:
                if o["id"] == order_id:
                    o.update(update_data)
                    with open(self.orders_file, "w", encoding="utf-8") as f:
                        json.dump(orders, f, ensure_ascii=False, indent=4)
                    return True
            return False

    async def get_order_by_id(self, order_id: str) -> Dict[str, Any]:
        if self.use_mongodb:
            order = await self.db.orders.find_one({"id": order_id})
            if order:
                order["_id"] = str(order["_id"])
            return order
        else:
            orders = await self.get_orders()
            for o in orders:
                if o["id"] == order_id:
                    return o
            return None

    # --- Image/Media Storage (Internal MongoDB Storage) ---
    async def save_image(self, target: str, content: bytes, content_type: str = "image/png"):
        """Stores images directly in MongoDB as Base64 (Perfect for small site assets)"""
        import base64
        base64_data = base64.b64encode(content).decode('utf-8')
        data_uri = f"data:{content_type};base64,{base64_data}"
        
        if self.use_mongodb:
            await self.db.media.update_one(
                {"target": target},
                {"$set": {"data_uri": data_uri, "timestamp": datetime.datetime.now().isoformat()}},
                upsert=True
            )
            return data_uri
        else:
            # Fallback to local file as before
            filename = f"{target}.png"
            # We don't save the base64 here to keep local storage clean, 
            # the main.py handles local file saving.
            return filename
