#!/bin/bash

# Virtual Training Assistant - Dependency Installation Script
set -e  # Exit on any error

echo "Installing Virtual Training Assistant dependencies..."

# Update package list
echo "Updating package list..."
apt-get update

# Install system dependencies for OpenCV and other libraries
echo "Installing system dependencies..."
apt-get install -y \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgthread-2.0-0 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libatlas-base-dev \
    gfortran \
    wget \
    curl \
    build-essential \
    pkg-config \
    libhdf5-dev \
    libhdf5-serial-dev \
    libhdf5-103 \
    libqtgui4 \
    libqtwebkit4 \
    libqt4-test \
    python3-pyqt5 \
    libgstreamer1.0-0 \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-doc \
    gstreamer1.0-tools \
    gstreamer1.0-x \
    gstreamer1.0-alsa \
    gstreamer1.0-gl \
    gstreamer1.0-gtk3 \
    gstreamer1.0-qt5 \
    gstreamer1.0-pulseaudio

# Upgrade pip to latest version
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install Python dependencies with specific versions for compatibility
echo "Installing Python dependencies..."
pip install --no-cache-dir --upgrade setuptools wheel

# Install requirements with retry mechanism
for i in {1..3}; do
    echo "Attempt $i: Installing requirements..."
    if pip install --no-cache-dir -r requirements.txt; then
        echo "Requirements installed successfully!"
        break
    else
        echo "Attempt $i failed, retrying..."
        if [ $i -eq 3 ]; then
            echo "All attempts failed. Please check the error messages above."
            exit 1
        fi
        sleep 5
    fi
done

# Verify critical imports
echo "Verifying installation..."
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
python -c "import streamlit; print('Streamlit version:', streamlit.__version__)"
python -c "import ultralytics; print('Ultralytics imported successfully')"
python -c "import plotly; print('Plotly imported successfully')"

echo "Installation complete!"
echo "You can now run the application with: streamlit run vta.py"
