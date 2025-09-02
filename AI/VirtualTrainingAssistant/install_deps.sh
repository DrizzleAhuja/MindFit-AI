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

# Upgrade pip and install setuptools/wheel
echo "Upgrading pip and installing build tools..."
pip install --upgrade pip setuptools wheel

# Aggressively uninstall potentially conflicting packages
echo "Cleaning up conflicting Python packages..."
pip uninstall -y numpy opencv-python opencv-python-headless ultralytics || true

# Install numpy first to satisfy other dependencies
echo "Installing numpy..."
pip install --no-cache-dir numpy>=2.0.0

# Install headless OpenCV
echo "Installing opencv-python-headless..."
pip install --no-cache-dir opencv-python-headless

# Install ultralytics (should now use headless OpenCV)
echo "Installing ultralytics..."
pip install --no-cache-dir ultralytics

# Install remaining requirements from requirements.txt
echo "Installing remaining Python dependencies from requirements.txt..."
pip install --no-cache-dir -r requirements.txt

echo "Verifying installation..."
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
python -c "import streamlit; print('Streamlit version:', streamlit.__version__)"
python -c "import ultralytics; print('Ultralytics imported successfully')"
python -c "import plotly; print('Plotly imported successfully')"
python -c "import numpy; print('NumPy version:', numpy.__version__)"

echo "--- Diagnostic Info ---"
echo "Python executable: $(which python)"
echo "Pip executable: $(which pip)"
echo "Python path: $PYTHONPATH"
echo "Installed Python packages:"
pip freeze
echo "-----------------------"

echo "Installation complete!"
echo "You can now run the application with: streamlit run vta.py"
