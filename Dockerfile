FROM python:3.10-slim

WORKDIR /app

# Copy dependency files
COPY AI/VirtualTrainingAssistant/requirements.txt .
COPY AI/VirtualTrainingAssistant/packages.txt .
COPY AI/VirtualTrainingAssistant/vta.py AI/VirtualTrainingAssistant/vta.py
COPY AI/VirtualTrainingAssistant/yolov8n-pose.pt AI/VirtualTrainingAssistant/yolov8n-pose.pt

# Install system dependencies
RUN apt-get update && cat packages.txt | xargs apt-get install -y --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port Streamlit runs on
EXPOSE 8501

# Run the Streamlit app
ENTRYPOINT ["streamlit", "run", "AI/VirtualTrainingAssistant/vta.py", "--server.port=8501", "--server.address=0.0.0.0", "--server.enableCORS=false", "--server.enableXsrfProtection=false"]
