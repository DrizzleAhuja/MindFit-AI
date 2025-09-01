# Virtual Training Assistant (VTA)

A real-time fitness tracking application using computer vision and pose estimation to help users perform exercises with proper form.

## Features

- **Real-time Pose Detection**: Uses YOLOv8 pose estimation model
- **Exercise Tracking**: Supports multiple exercises:
  - Left/Right Dumbbell Curls
  - Lateral Raises
  - Front Raises
  - Triceps Kickbacks
- **Form Feedback**: Provides real-time feedback on exercise form
- **Rep Counting**: Automatically counts repetitions
- **Calorie Tracking**: Estimates calories burned based on exercises
- **Progress Visualization**: Charts and graphs for workout progress

## Requirements

- Python 3.8+
- Webcam access
- Good lighting conditions
- Single person in frame

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Run the application:
```bash
streamlit run vta.py
```

2. Open your browser and go to `http://localhost:8501`
3. Select an exercise from the sidebar
4. Click "Start Camera" to begin tracking
5. Follow the on-screen instructions and feedback

## Deployment on Streamlit Cloud

1. Push your code to GitHub
2. Go to [Streamlit Cloud](https://streamlit.io/cloud)
3. Connect your GitHub repository
4. Select the `vta.py` file as the main script
5. Deploy!

## File Structure

```
VirtualTrainingAssistant/
├── vta.py                 # Main Streamlit application
├── yolov8n-pose.pt       # YOLOv8 pose estimation model
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Technical Details

- **Framework**: Streamlit
- **Computer Vision**: OpenCV + YOLOv8
- **Pose Estimation**: Ultralytics YOLOv8n-pose
- **Visualization**: Plotly
- **Real-time Processing**: OpenCV VideoCapture

## Notes

- The model file `yolov8n-pose.pt` is required for pose detection
- Ensure good lighting for accurate pose detection
- The application works best with a single person in the camera frame
- Webcam permissions are required for the application to function
