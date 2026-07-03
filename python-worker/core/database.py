import os
from pymongo import MongoClient
from dotenv import load_dotenv

class DatabaseManager:
    """Quản lý kết nối tới MongoDB"""
    def __init__(self):
        load_dotenv()
        self.mongo_url = os.getenv("MONGO_URL")
        print(f"[DB] Đang kết nối tới MongoDB...")
        self.client = MongoClient(self.mongo_url)
        self.db = self.client.get_database()
        print(f"[DB] Kết nối thành công tới Database: {self.db.name}")

    def get_collection(self, collection_name: str):
        return self.db[collection_name]
