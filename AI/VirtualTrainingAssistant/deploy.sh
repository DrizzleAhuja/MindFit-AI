#!/bin/bash

# Virtual Training Assistant - Cloud Deployment Script
# This script is optimized for cloud platforms like Streamlit Cloud, Heroku, etc.

set -e  # Exit on any error

echo "=========================================="
echo "Virtual Training Assistant Cloud Deployment"
echo "=========================================="

# Function to install system dependencies for cloud environments
install_cloud_deps() {
    echo "Installing cloud-optimized dependencies..."
    
    # For cloud environments, we need minimal system dependencies
    apt-get update
    
    # Install only essential packages for headless operation
    apt-get install -y \
        libgl1-mesa-glx \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        libgomp1 \
        libgthread-2.0-0 \
        libavcodec-dev \
        libavformat-dev \
        libswscale-dev \
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
        python3-dev \
        python3-pip \
        python3-venv
    
    echo "Cloud dependencies installed successfully!"
}

# Function to setup Python environment for cloud
setup_cloud_python() {
    echo "Setting up Python environment for cloud deployment..."
    
    # Upgrade pip and install build tools
    python -m pip install --upgrade pip setuptools wheel
    
    # Install Python dependencies with cloud-optimized versions
    echo "Installing Python dependencies..."
    
    ./install_deps.sh # Use the dedicated dependency installation script
    
    echo "Python environment setup complete!"
}

# Function to verify cloud installation
verify_cloud_installation() {
    echo "Verifying cloud installation..."
    
    # Test critical imports
    echo "Testing OpenCV (headless)..."
    python -c "import cv2; print('✓ OpenCV version:', cv2.__version__)"
    
    echo "Testing Streamlit..."
    python -c "import streamlit; print('✓ Streamlit version:', streamlit.__version__)"
    
    echo "Testing Ultralytics..."
    python -c "import ultralytics; print('✓ Ultralytics imported successfully')"
    
    echo "Testing Plotly..."
    python -c "import plotly; print('✓ Plotly imported successfully')"
    
    echo "Testing NumPy..."
    python -c "import numpy; print('✓ NumPy version:', numpy.__version__)"
    
    echo "All cloud tests passed! Deployment is ready."
}

# Function to create cloud configuration
create_cloud_config() {
    echo "Creating cloud configuration..."
    
    # Create .streamlit/config.toml for cloud deployment
    mkdir -p .streamlit
    cat > .streamlit/config.toml << 'EOF'
[server]
port = 8501
address = "0.0.0.0"
headless = true
enableCORS = false
enableXsrfProtection = false

[browser]
gatherUsageStats = false

[theme]
primaryColor = "#FF6B6B"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"
EOF
    
    echo "Cloud configuration created!"
}

# Main execution
main() {
    echo "Starting cloud deployment setup..."
    
    # Ensure install_deps.sh is executable and run it for all dependencies
    chmod +x install_deps.sh
    ./install_deps.sh
    
    # Create cloud configuration
    create_cloud_config

    echo "=========================================="
    echo "Cloud deployment setup completed!"
    echo "=========================================="
    echo "Your application is ready for cloud deployment."
    echo "To run locally: streamlit run vta.py"
    echo "=========================================="
}

# Run main function
main "$@"
