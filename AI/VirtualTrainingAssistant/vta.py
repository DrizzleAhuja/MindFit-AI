import streamlit as st
import cv2
import numpy as np
from ultralytics import YOLO
import plotly.graph_objects as go
import time
import math
import torch
from ultralytics.nn.tasks import PoseModel
from torch.nn import Sequential
from streamlit_webrtc import webrtc_streamer, VideoProcessorBase, WebRtcMode, ClientSettings

# Page configuration - MUST BE FIRST COMMAND
st.set_page_config(page_title="Fitness Tracker", layout="wide")

# Custom CSS for styling
st.markdown("""
    <style>
    .main {
        background-color: #f5f5f5;
    }
    .stButton>button {
        background-color: #025246;
        color: white;
        border-radius: 5px;
        padding: 10px 20px;
    }
    .feedback-good {
        color: green;
        font-weight: bold;
    }
    .feedback-bad {
        color: red;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)

# Header
st.markdown("""
    <div style="background-color:#025246; padding:10px">
        <h2 style="color:white; text-align:center;">Train Here</h2>
    </div>
    """, unsafe_allow_html=True)

# Initialize session state
if 'counter' not in st.session_state:
    st.session_state.counter = 0
if 'direction' not in st.session_state:
    st.session_state.direction = "up"  # Start with arm extended
if 'start_time' not in st.session_state:
    st.session_state.start_time = None
if 'camera_started' not in st.session_state:
    st.session_state.camera_started = False
if 'feedback' not in st.session_state:
    st.session_state.feedback = ""
if 'feedback_type' not in st.session_state:
    st.session_state.feedback_type = ""

# Sidebar for exercise selection
app_mode = st.sidebar.selectbox(
    "Choose the exercise",
    ["About", "Left Dumbbell", "Right Dumbbell", "Lateral Raises", "Front Raises", "Triceps Kickbacks"]
)

def calculate_angle(point1, point2, point3):
    """Calculate angle between three points"""
    a = np.array(point1)
    b = np.array(point2)
    c = np.array(point3)

    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)

    if angle > 180.0:
        angle = 360-angle

    return angle

def calculate_distance(point1, point2):
    """Calculate distance between two points"""
    return math.sqrt((point2[0]-point1[0])**2 + (point2[1]-point1[1])**2)

class VideoProcessor(VideoProcessorBase):
    def __init__(self, app_mode):
        self.model = YOLO('yolov8n-pose.pt')
        self.counter = 0
        self.direction = "up"
        self.feedback = ""
        self.feedback_type = ""
        self.start_time = None
        self.app_mode = app_mode # Store app_mode as an instance variable

    def recv(self, frame):
        img = frame.to_ndarray(format="bgr24")

        if self.start_time is None:
            self.start_time = time.time()

        # Process frame with YOLO
        results = self.model(img)[0]
        keypoints = results.keypoints.data[0] if len(results.keypoints.data) > 0 else None

        if keypoints is not None and len(keypoints) >= 10:  # Ensure keypoints are detected
            # Draw keypoints
            for kp in keypoints:
                x, y = int(kp[0]), int(kp[1])
                cv2.circle(img, (x, y), 5, (0, 255, 0), -1)
                
            # Draw skeleton connections
            connections = [
                (5, 7), (7, 9),  # Left arm
                (6, 8), (8, 10),  # Right arm
                (5, 6),  # Shoulders
                (5, 11), (6, 12),  # Torso
                (11, 13), (13, 15),  # Left leg
                (12, 14), (14, 16)   # Right leg
            ]
            
            for conn in connections:
                if len(keypoints) > max(conn):
                    pt1 = (int(keypoints[conn[0]][0]), int(keypoints[conn[0]][1]))
                    pt2 = (int(keypoints[conn[1]][0]), int(keypoints[conn[1]][1]))
                    cv2.line(img, pt1, pt2, (0, 255, 255), 2)

            angle = 0
            # Exercise logic
            if self.app_mode == "Left Dumbbell":
                shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
                elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
                wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
                angle = calculate_angle(shoulder, elbow, wrist)

                if angle > 160 and self.direction == "down":
                    self.direction = "up"
                if angle < 60 and self.direction == "up":
                    self.counter += 1
                    self.direction = "down"
            elif self.app_mode == "Right Dumbbell":
                shoulder = (int(keypoints[6][0]), int(keypoints[6][1]))
                elbow = (int(keypoints[8][0]), int(keypoints[8][1]))
                wrist = (int(keypoints[10][0]), int(keypoints[10][1]))
                angle = calculate_angle(shoulder, elbow, wrist)

                if angle > 160 and self.direction == "down":
                    self.direction = "up"
                if angle < 60 and self.direction == "up":
                    self.counter += 1
                    self.direction = "down"
            elif self.app_mode == "Lateral Raises":
                shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
                elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
                wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
                angle = calculate_angle(shoulder, elbow, wrist)

                if angle > 160 and self.direction == "down":
                    self.direction = "up"
                if angle < 30 and self.direction == "up":
                    self.counter += 1
                    self.direction = "down"
            elif self.app_mode == "Front Raises":
                shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
                elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
                wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
                angle = calculate_angle(shoulder, elbow, wrist)

                if angle > 160 and self.direction == "down":
                    self.direction = "up"
                if angle < 30 and self.direction == "up":
                    self.counter += 1
                    self.direction = "down"
            elif self.app_mode == "Triceps Kickbacks":
                shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
                elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
                wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
                angle = calculate_angle(shoulder, elbow, wrist)

                if angle < 30 and self.direction == "up":
                    self.direction = "down"
                if angle > 160 and self.direction == "down":
                    self.counter += 1
                    self.direction = "up"

            # Check form and get feedback
            self.feedback, self.feedback_type = check_form(keypoints, self.app_mode, angle, self.direction)

            # Draw angle and rep counter
            cv2.putText(img, f"Angle: {int(angle)}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.putText(img, f"Reps: {int(self.counter)}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # Draw feedback
            text_color = (0, 255, 0) if self.feedback_type == "good" else (0, 0, 255)
            cv2.putText(img, self.feedback, (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.8, text_color, 2)

        return img

def check_form(keypoints, exercise_type, angle, direction):
    """Check if the form is correct for the exercise"""
    feedback = ""
    feedback_type = "good"
    
    if len(keypoints) < 17:  # Not all keypoints detected
        return "Make sure your whole body is visible", "bad"
    
    if exercise_type in ["Left Dumbbell", "Right Dumbbell"]:
        # Check elbow movement for curls
        shoulder_idx = 5 if exercise_type == "Left Dumbbell" else 6
        elbow_idx = 7 if exercise_type == "Left Dumbbell" else 8
        hip_idx = 11 if exercise_type == "Left Dumbbell" else 12
        
        shoulder = (int(keypoints[shoulder_idx][0]), int(keypoints[shoulder_idx][1]))
        elbow = (int(keypoints[elbow_idx][0]), int(keypoints[elbow_idx][1]))
        hip = (int(keypoints[hip_idx][0]), int(keypoints[hip_idx][1]))
        
        # Check if elbow is moving forward
        if elbow[0] < shoulder[0] - 30:  # Elbow too far forward
            feedback = "Keep your elbow close to your body"
            feedback_type = "bad"
        elif angle > 160 and direction == "down":
            feedback = "Good form! Fully extend your arm"
            feedback_type = "good"
        elif angle < 60 and direction == "up":
            feedback = "Good contraction! Now lower slowly"
            feedback_type = "good"
    
    elif exercise_type == "Lateral Raises":
        shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
        elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
        wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
        
        # Check if raising too high
        if wrist[1] < shoulder[1] - 50:  # Wrist above shoulder
            feedback = "Don't raise above shoulder level"
            feedback_type = "bad"
        elif angle > 160 and direction == "down":
            feedback = "Good starting position"
            feedback_type = "good"
        elif angle < 30 and direction == "up":
            feedback = "Perfect! Arms parallel to floor"
            feedback_type = "good"
    
    elif exercise_type == "Front Raises":
        shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
        elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
        wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
        
        # Check if raising too high
        if wrist[1] < shoulder[1] - 50:  # Wrist above shoulder
            feedback = "Don't raise above shoulder level"
            feedback_type = "bad"
        elif angle > 160 and direction == "down":
            feedback = "Good starting position"
            feedback_type = "good"
        elif angle < 30 and direction == "up":
            feedback = "Perfect! Arms parallel to floor"
            feedback_type = "good"
    
    elif exercise_type == "Triceps Kickbacks":
        shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
        elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
        wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
        
        # Check upper arm position
        upper_arm_angle = calculate_angle(
            (shoulder[0], shoulder[1]+100),  # Vertical reference
            shoulder,
            elbow
        )
        
        if upper_arm_angle < 45:  # Upper arm not parallel to floor
            feedback = "Keep upper arm parallel to floor"
            feedback_type = "bad"
        elif angle < 30 and direction == "up":
            feedback = "Good extension! Now return slowly"
            feedback_type = "good"
        elif angle > 160 and direction == "down":
            feedback = "Good starting position"
            feedback_type = "good"
    
    return feedback, feedback_type

if app_mode == "About":
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("## Welcome to the Training Arena")
        st.markdown("Choose the workout you wish to do from the sidebar")
        st.write("""
        Here are few general instructions to follow while doing the workout:

        - It is necessary for you to provide web cam access. If you do not have a webcam, kindly attach an external camera.
        - Please avoid crowded places as the model can only detect 1 person.
        - Please ensure that the surrounding is well lit so that the camera can detect you.
        - Please make sure the camera is focused on you based on the exercise.

        With all that out of the way, it's time for you to get pumped up!
        """)

    with col2:
        st.image("https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop",
                caption="Get ready to work out!")

else:
    # Common setup for all exercise modes
    st.markdown(f"## {app_mode}")

    # Display exercise instructions
    if app_mode == "Left Dumbbell":
        st.write("""
        **Instructions:**
        1. Stand straight with dumbbell in left hand
        2. Keep elbow close to your torso
        3. Curl the weight while keeping upper arm stationary
        4. Only forearms should move
        5. Slowly lower back to starting position
        """)
    elif app_mode == "Right Dumbbell":
        st.write("""
        **Instructions:**
        1. Stand straight with dumbbell in right hand
        2. Keep elbow close to your torso
        3. Curl the weight while keeping upper arm stationary
        4. Only forearms should move
        5. Slowly lower back to starting position
        """)
    elif app_mode == "Lateral Raises":
        st.write("""
        **Instructions:**
        1. Stand with dumbbells at sides
        2. Keep slight bend in elbows
        3. Raise arms to shoulder height
        4. Don't raise above shoulders
        5. Lower back slowly
        """)
    elif app_mode == "Front Raises":
        st.write("""
        **Instructions:**
        1. Stand with dumbbells in front of thighs
        2. Keep arms straight
        3. Raise arms to shoulder height
        4. Don't raise above shoulders
        5. Lower back slowly
        """)
    elif app_mode == "Triceps Kickbacks":
        st.write("""
        **Instructions:**
        1. Bend at waist with back straight
        2. Keep upper arm parallel to floor
        3. Extend arm backward
        4. Fully straighten elbow
        5. Return to starting position
        """)

    # User inputs
    weight = st.slider('What is your weight (kg)?', 20, 130, 40)
    goal_calories = st.slider('Set a goal calorie to burn', 1, 200, 15)

    ctx = webrtc_streamer(
        key="fitness-tracker",
        mode=WebRtcMode.SENDRECV,
        client_settings=ClientSettings(
            rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
            media_stream_constraints={"video": True, "audio": False},
        ),
        video_processor_factory=lambda: VideoProcessor(app_mode),
        async_processing=True,
    )

    if ctx.state.playing:
        st.write("---")
        st.write("## Workout Summary")

        # Access processor state
        processor = ctx.video_processor

        if processor:
            duration = time.time() - processor.start_time if processor.start_time else 0
            
            calories_burned = 0
            if app_mode in ["Left Dumbbell", "Right Dumbbell"]:
                calories_burned = 0.25 * processor.counter
            elif app_mode in ["Lateral Raises", "Front Raises"]:
                calories_burned = 0.3 * processor.counter
            elif app_mode == "Triceps Kickbacks":
                calories_burned = 0.2 * processor.counter
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Reps", processor.counter)
            with col2:
                st.metric("Duration", f"{int(duration)}s")
            with col3:
                st.metric("Calories", f"{calories_burned:.2f} kcal")

            # Create progress chart
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=['Calories'],
                y=[calories_burned],
                name='Calories Burned',
                marker_color='rgb(26, 118, 255)'
            ))
            fig.add_trace(go.Bar(
                x=['Calories'],
                y=[goal_calories],
                name='Goal',
                marker_color='rgb(55, 83, 109)'
            ))

            fig.update_layout(
                title='Workout Progress',
                xaxis_tickfont_size=14,
                yaxis=dict(
                    title='Calories (kcal)',
                    title_font_size=16,
                    tickfont_size=14,
                ),
                legend=dict(
                    x=0,
                    y=1.0,
                    bgcolor='rgba(255, 255, 255, 0)',
                    bordercolor='rgba(255, 255, 255, 0)'
                ),
                barmode='group',
                bargap=0.15,
                bargroupgap=0.1
            )
            st.plotly_chart(fig)

            # Feedback (using processor's feedback)
            feedback_class = "feedback-good" if processor.feedback_type == "good" else "feedback-bad"
            st.markdown(
                f"<div class='{feedback_class}'>{processor.feedback}</div>",
                unsafe_allow_html=True
            )

            # Goal achievement feedback
            if calories_burned >= goal_calories:
                st.success("🎉 Congratulations! You've reached your goal!")
            elif calories_burned >= goal_calories * 0.8:
                st.info("💪 Almost there! Keep going!")
            else:
                st.warning("🔥 Keep pushing! You can do it!")

        else:
            st.info("Waiting for video stream to start...")

    st.markdown("""
        <div style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: #025246; color: white; text-align: center; padding: 10px;">
            <p style="margin: 0;">© 2025 GenFit AI. All rights reserved.</p>
        </div>
        """, unsafe_allow_html=True)