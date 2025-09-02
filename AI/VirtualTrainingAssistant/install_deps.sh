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

# Install Ultralytics separately to manage its dependencies
echo "Installing Ultralytics..."
# Python dependencies will be handled by requirements.txt

echo "Verifying installation..."
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
python -c "import streamlit; print('Streamlit version:', streamlit.__version__)"
python -c "import ultralytics; print('Ultralytics imported successfully')"
python -c "import plotly; print('Plotly imported successfully')"
python -c "import numpy; print('NumPy version:', numpy.__version__)"

echo "Installation complete!"
echo "You can now run the application with: streamlit run vta.py"
