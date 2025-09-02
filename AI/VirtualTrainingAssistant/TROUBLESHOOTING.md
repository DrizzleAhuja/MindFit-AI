# Virtual Training Assistant - Troubleshooting Guide

## Common Issues and Solutions

### 1. ImportError: libGL.so.1: cannot open shared object file

**Problem**: OpenCV cannot find OpenGL libraries.

**Solution**:
```bash
# Install OpenGL libraries
sudo apt-get update
sudo apt-get install -y libgl1-mesa-glx libgl1-mesa-dri

# For headless environments, use opencv-python-headless
pip uninstall opencv-python
pip install opencv-python-headless
```

### 2. Python 3.13 Compatibility Issues

**Problem**: `AttributeError: module 'pkgutil' has no attribute 'ImpImporter'`

**Solution**:
- Use Python 3.9 instead of Python 3.13
- Update your `runtime.txt` to specify `python-3.9`
- Ensure you're using compatible package versions

### 3. CV2 Import Failures

**Problem**: `ImportError: No module named 'cv2'` or OpenCV import errors.

**Solution**:
```bash
# Install system dependencies first
sudo apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev

# Then install OpenCV
pip install opencv-python-headless==4.8.1.78
```

### 4. Streamlit Deployment Issues

**Problem**: Streamlit app fails to start or crashes.

**Solution**:
1. Check your `requirements.txt` has compatible versions
2. Ensure all system dependencies are installed
3. Use the provided deployment scripts:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### 5. Ultralytics YOLO Model Loading Issues

**Problem**: YOLO model fails to load or download.

**Solution**:
```bash
# Ensure the model file exists
ls -la yolov8n-pose.pt

# If missing, download it
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-pose.pt
```

### 6. Memory Issues

**Problem**: Application runs out of memory.

**Solution**:
- Use smaller model variants (yolov8n instead of yolov8s/m/l/x)
- Reduce image resolution in processing
- Add memory monitoring to your application

### 7. Port Binding Issues

**Problem**: Port 8501 already in use.

**Solution**:
```bash
# Find and kill process using port 8501
lsof -ti:8501 | xargs kill -9

# Or use a different port
streamlit run vta.py --server.port=8502
```

## Platform-Specific Solutions

### Streamlit Cloud
1. Use `deploy.sh` script
2. Ensure `runtime.txt` specifies Python 3.9
3. Use `opencv-python-headless` instead of `opencv-python`
4. Check that all dependencies are in `requirements.txt`

### Docker
1. Use the provided `Dockerfile`
2. Build with: `docker build -t vta .`
3. Run with: `docker run -p 8501:8501 vta`

### Local Development
1. Use `setup.sh` for complete setup
2. Create virtual environment: `python3 -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install: `pip install -r requirements.txt`

## Verification Commands

Test your installation with these commands:

```bash
# Test OpenCV
python -c "import cv2; print('OpenCV version:', cv2.__version__)"

# Test Streamlit
python -c "import streamlit; print('Streamlit version:', streamlit.__version__)"

# Test Ultralytics
python -c "import ultralytics; print('Ultralytics imported successfully')"

# Test Plotly
python -c "import plotly; print('Plotly imported successfully')"

# Test NumPy
python -c "import numpy; print('NumPy version:', numpy.__version__)"
```

## Getting Help

If you continue to experience issues:

1. Check the error logs carefully
2. Ensure you're using the correct Python version (3.9)
3. Verify all system dependencies are installed
4. Try the provided setup scripts
5. Check that your model files are present and accessible

## Environment Variables

For cloud deployment, you may need to set these environment variables:

```bash
export PYTHONUNBUFFERED=1
export DEBIAN_FRONTEND=noninteractive
export STREAMLIT_SERVER_HEADLESS=true
export STREAMLIT_SERVER_ENABLE_CORS=false
```
