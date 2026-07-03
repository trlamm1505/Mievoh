import json, os, sys
import warnings
from core.database import DatabaseManager
from core.rabbitmq import RabbitMQClient
from core.pandas_service import PandasRecommendationService

# Bắt buộc in ra tiếng Việt (UTF-8) trên Terminal của Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Tắt cảnh báo rác của thư viện mã hóa liên quan đến chứng chỉ MongoDB Atlas
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="Parsed a serial number which wasn't positive")

class WorkerApp:
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.rabbit_client = RabbitMQClient()
        self.pandas_service = PandasRecommendationService(self.db_manager, self.rabbit_client)

    def message_handler(self, ch, method, properties, body):
        try:
            msg = json.loads(body.decode('utf-8'))
            pattern = msg.get("pattern")
            
            if pattern == "TRIGGER_ANALYSIS":
                data = msg.get("data", {})
                user_id = data.get("userId", "system")
                print(f"\n[x] Nhận lệnh TRIGGER_ANALYSIS từ Admin: {user_id}")
                self.pandas_service.process_logic(user_id)
                
        except Exception as e:
            print(f"[-] Lỗi xử lý tin nhắn: {e}")

    def run(self):
        self.rabbit_client.start_consuming(self.message_handler)

if __name__ == '__main__':
    os.system('cls' if os.name == 'nt' else 'clear')
    app = WorkerApp()
    app.run()
