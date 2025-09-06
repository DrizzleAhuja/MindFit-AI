#!/bin/bash

# Virtual Training Assistant - Comprehensive Setup Script
set -e  # Exit on any error

echo "=========================================="
echo "Virtual Training Assistant Setup"
echo "=========================================="

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "This script must be run as root or with sudo"
        exit 1
    fi
}

# Function to detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        echo "Cannot detect OS"
        exit 1
    fi
    echo "Detected OS: $OS $VER"
}

# Function to install system dependencies
install_system_deps() {
    echo "Installing system dependencies..."
    
    # Update package list
    apt-get update
    
    # Install essential packages
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
        python3-dev \
        python3-pip \
        python3-venv \
        git
    
    echo "System dependencies installed successfully!"
}

# Function to setup Python environment
setup_python_env() {
    echo "Setting up Python environment..."
    
    # Check Python version
    python3 --version

    # Ensure Python version is 3.10 or above
    PYTHON_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
    PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")

    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
        echo "Error: Python 3.10 or higher is required."
        exit 1
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    echo "Upgrading pip..."
    python -m pip install --upgrade pip setuptools wheel
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    pip install --no-cache-dir -r requirements.txt
    
    echo "Python environment setup complete!"
}

# Function to verify installation
verify_installation() {
    echo "Verifying installation..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Test critical imports
    echo "Testing OpenCV..."
    python -c "import cv2; print('✓ OpenCV version:', cv2.__version__)"
    
    echo "Testing Streamlit..."
    python -c "import streamlit; print('✓ Streamlit version:', streamlit.__version__)"
    
    echo "Testing Ultralytics..."
    python -c "import ultralytics; print('✓ Ultralytics imported successfully')"
    
    echo "Testing Plotly..."
    python -c "import plotly; print('✓ Plotly imported successfully')"
    
    echo "Testing NumPy..."
    python -c "import numpy; print('✓ NumPy version:', numpy.__version__)"
    
    echo "All tests passed! Installation is successful."
}

# Function to create startup script
create_startup_script() {
    echo "Creating startup script..."
    
    cat > start_vta.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
streamlit run vta.py --server.port=8501 --server.address=0.0.0.0
EOF
    
    chmod +x start_vta.sh
    echo "Startup script created: start_vta.sh"
}

# Main execution
main() {
    echo "Starting Virtual Training Assistant setup..."
    
    # Check if running as root
    check_root
    
    # Detect OS
    detect_os
    
    # Install system dependencies
    install_system_deps
    
    # Setup Python environment
    setup_python_env
    
    # Verify installation
    verify_installation
    
    # Create startup script
    create_startup_script
    
    echo "=========================================="
    echo "Setup completed successfully!"
    echo "=========================================="
    echo "To start the application, run:"
    echo "  ./start_vta.sh"
    echo "Or manually:"
    echo "  source venv/bin/activate"
    echo "  streamlit run vta.py"
    echo "=========================================="
}

# Run main function
main "$@"
