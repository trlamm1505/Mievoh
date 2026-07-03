# Sử dụng Python 3.12 bản nhẹ nhất
FROM python:3.12-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Khắc phục lỗi font chữ trên Terminal
ENV PYTHONIOENCODING=utf-8

# Copy file thư viện vào và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn vào
COPY . .

# Chạy file main
CMD ["python", "-u", "main.py"]
