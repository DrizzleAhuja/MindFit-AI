#!/bin/bash

# Virtual Training Assistant - Cloud Deployment Script
# This script is optimized for cloud platforms like Streamlit Cloud, Heroku, etc.

set -e  # Exit on any error

echo "=========================================="
echo "Virtual Training Assistant Cloud Deployment"
echo "=========================================="

# Ensure install_deps.sh is executable and run it
chmod +x ./install_deps.sh
./install_deps.sh

echo "=========================================="
echo "Starting Streamlit application..."
echo "=========================================="

# Run the Streamlit application
streamlit run AI/VirtualTrainingAssistant/vta.py --server.port=$PORT --server.enableCORS=false --server.enableXsrfProtection=false
