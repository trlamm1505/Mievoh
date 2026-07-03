import os
import pika
import json
from dotenv import load_dotenv

class RabbitMQClient:
    """Quản lý kết nối tới RabbitMQ và thông điệp"""
    def __init__(self):
        load_dotenv()
        self.rabbit_url = os.getenv("RABBIT_MQ_URL", "amqp://admin:admin123@localhost:5673")
        self.trigger_queue = 'trigger_queue'
        self.progress_queue = 'main_queue'
        self.connection = None
        self.channel = None

    def connect(self):
        print("[RabbitMQ] Đang kết nối tới RabbitMQ...")
        parameters = pika.URLParameters(self.rabbit_url)
        # Đặt tên kết nối để dễ quản lý trên RabbitMQ UI
        parameters.client_properties = {'connection_name': 'python-ai-worker'}
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.trigger_queue, durable=False)
        self.channel.queue_declare(queue=self.progress_queue, durable=False)
        print("[RabbitMQ] Kết nối thành công!")

    def send_progress(self, progress_percent: int, user_id: str = "system"):
        if not self.channel:
            return
            
        message = {
            "pattern": "UPDATE_PROGRESS",
            "data": { "progress": progress_percent, "userId": user_id }
        }
        self.channel.basic_publish(
            exchange='',
            routing_key=self.progress_queue,
            body=json.dumps(message)
        )
        print(f"[+] Đã báo cáo tiến độ: {progress_percent}%")

    def start_consuming(self, callback):
        if not self.channel:
            self.connect()
            
        print(f'\n [*] Python Worker đang chờ tín hiệu ở hàng đợi ({self.trigger_queue}). Bấm CTRL+C để thoát.')
        self.channel.basic_consume(queue=self.trigger_queue, on_message_callback=callback, auto_ack=True)
        
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print("\n[!] Đã tắt Worker.")
            self.connection.close()
