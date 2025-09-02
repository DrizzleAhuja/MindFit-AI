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
    wget \
    curl \
    build-essential \
    pkg-config

# Create and activate a virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip and install setuptools/wheel
echo "Upgrading pip and installing build tools..."
pip install --upgrade pip setuptools wheel

# Aggressively uninstall potentially conflicting packages
echo "Cleaning up conflicting Python packages..."
pip uninstall -y numpy opencv-python opencv-python-headless ultralytics || true
pip install --no-cache-dir numpy>=2.0.0 # Install numpy first to satisfy other dependencies
pip install --no-cache-dir opencv-python-headless # Ensure headless OpenCV is installed

# Install remaining requirements from requirements.txt (excluding already installed ones)
echo "Installing remaining Python dependencies from requirements.txt..."
pip install --no-cache-dir -r requirements.txt

# Install ultralytics, ensuring it uses the headless OpenCV
echo "Installing Ultralytics..."
pip install --no-cache-dir ultralytics # Ultralytics should now use opencv-python-headless

echo "Verifying installation..."
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
python -c "import streamlit; print('Streamlit version:', streamlit.__version__)"
python -c "import ultralytics; print('Ultralytics imported successfully')"
python -c "import plotly; print('Plotly imported successfully')"
python -c "import numpy; print('NumPy version:', numpy.__version__)"

echo "Installation complete!"
echo "You can now run the application with: streamlit run vta.py"
