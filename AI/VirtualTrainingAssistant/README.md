# Virtual Training Assistant (VTA)

A real-time fitness tracking application using computer vision and pose estimation to help users perform exercises with proper form. The app includes both camera-based tracking and manual tracking modes.

## Features

- **Real-time Pose Detection**: Uses YOLOv8 pose estimation model (when available)
- **Manual Tracking Mode**: Fallback mode for environments without camera access
- **Exercise Tracking**: Supports multiple exercises:
  - Left/Right Dumbbell Curls
  - Lateral Raises
  - Front Raises
  - Triceps Kickbacks
- **Form Feedback**: Provides real-time feedback on exercise form
- **Rep Counting**: Automatically counts repetitions (camera mode) or manual counting
- **Calorie Tracking**: Estimates calories burned based on exercises
- **Progress Visualization**: Charts and graphs for workout progress

## Requirements

- Python 3.8+
- Webcam access (for camera mode)
- Good lighting conditions (for camera mode)
- Single person in frame (for camera mode)

## Installation

### Option 1: Quick Installation (Recommended)
```bash
pip install -r requirements.txt
```

### Option 2: Full Installation with System Dependencies (Linux/Ubuntu)
```bash
# Make the installation script executable
chmod +x install_deps.sh

# Run the installation script
./install_deps.sh
```

### Option 3: Manual Installation (Windows)
1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. If you encounter OpenCV issues, the app will automatically fall back to manual mode.

## Usage

### Camera Mode (Full Functionality)
1. Run the application:
```bash
streamlit run vta.py
```

2. Open your browser and go to `http://localhost:8501`
3. Select an exercise from the sidebar
4. Click "Start Camera" to begin tracking
5. Follow the on-screen instructions and feedback

### Manual Mode (Fallback)
1. Run the application:
```bash
streamlit run vta.py
```

2. The app will automatically detect if camera functionality is not available
3. Use the manual rep counter buttons to track your workout
4. All other features (calorie tracking, progress charts) remain available

### Demo Version
For a simplified version without camera dependencies:
```bash
streamlit run vta_simple.py
```

## Deployment on Streamlit Cloud

1. Push your code to GitHub
2. Go to [Streamlit Cloud](https://streamlit.io/cloud)
3. Connect your GitHub repository
4. Select the `vta.py` file as the main script
5. Deploy!

## File Structure

```
VirtualTrainingAssistant/
├── vta.py                    # Main Streamlit application (with fallback)
├── vta_simple.py            # Demo version without camera dependencies
├── yolov8n-pose.pt          # YOLOv8 pose estimation model
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
├── install_deps.sh         # Installation script (Linux)
├── test_installation.py    # Installation test script
└── README.md               # This file
```

## Technical Details

- **Framework**: Streamlit
- **Computer Vision**: OpenCV + YOLOv8 (when available)
- **Pose Estimation**: Ultralytics YOLOv8n-pose
- **Visualization**: Plotly
- **Real-time Processing**: OpenCV VideoCapture (camera mode)
- **Fallback Mode**: Manual tracking when camera is unavailable

## Troubleshooting

### OpenCV Import Error
If you see `ImportError: libGL.so.1: cannot open shared object file`, the app will automatically switch to manual mode. This is normal and expected in some environments.

### Camera Not Working
- Ensure webcam permissions are granted
- Check if another application is using the camera
- The app will show a warning and switch to manual mode if camera is unavailable

### Model File Missing
- The `yolov8n-pose.pt` file is automatically downloaded when first needed
- If download fails, the app will work in manual mode

### Testing Installation
Run the test script to verify your installation:
```bash
python test_installation.py
```

## Docker Deployment

Build and run with Docker:
```bash
docker build -t vta .
docker run -p 8501:8501 vta
```

## Notes

- The model file `yolov8n-pose.pt` is automatically downloaded when needed
- Ensure good lighting for accurate pose detection (camera mode)
- The application works best with a single person in the camera frame
- Webcam permissions are required for camera functionality
- The app gracefully falls back to manual mode when camera is unavailable
