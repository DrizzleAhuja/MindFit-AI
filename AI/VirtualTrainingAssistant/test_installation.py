#!/usr/bin/env python3
"""
Test script to verify Virtual Training Assistant installation
"""

def test_imports():
    """Test if all required packages can be imported"""
    print("Testing package imports...")
    
    try:
        import streamlit as st
        print("✅ Streamlit imported successfully")
    except ImportError as e:
        print(f"❌ Streamlit import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        import plotly.graph_objects as go
        print("✅ Plotly imported successfully")
    except ImportError as e:
        print(f"❌ Plotly import failed: {e}")
        return False
    
    try:
        import cv2
        print("✅ OpenCV imported successfully")
        print(f"   OpenCV version: {cv2.__version__}")
    except ImportError as e:
        print(f"⚠️  OpenCV import failed: {e}")
        print("   This is expected in some environments. The app will use manual mode.")
    
    try:
        from ultralytics import YOLO
        print("✅ YOLO imported successfully")
    except ImportError as e:
        print(f"⚠️  YOLO import failed: {e}")
        print("   This is expected if OpenCV is not available. The app will use manual mode.")
    
    return True

def test_model_file():
    """Test if the YOLO model file exists"""
    import os
    model_path = "yolov8n-pose.pt"
    if os.path.exists(model_path):
        print(f"✅ Model file found: {model_path}")
        return True
    else:
        print(f"⚠️  Model file not found: {model_path}")
        print("   The app will work in manual mode without pose detection.")
        return False

if __name__ == "__main__":
    print("Virtual Training Assistant - Installation Test")
    print("=" * 50)
    
    success = test_imports()
    test_model_file()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Installation test completed successfully!")
        print("You can now run the application with: streamlit run vta.py")
    else:
        print("❌ Some issues were found. Please check the error messages above.")
