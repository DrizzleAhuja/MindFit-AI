# import streamlit as st
# import cv2
# import numpy as np
# from ultralytics import YOLO
# import plotly.graph_objects as go
# import time

# # Page configuration
# st.set_page_config(page_title="Fitness Tracker", layout="wide")

# # Custom CSS for styling
# st.markdown("""
#     <style>
#     .main {
#         background-color: #f5f5f5;
#     }
#     .stButton>button {
#         background-color: #025246;
#         color: white;
#         border-radius: 5px;
#         padding: 10px 20px;
#     }
#     </style>
#     """, unsafe_allow_html=True)

# # Header
# st.markdown("""
#     <div style="background-color:#025246; padding:10px">
#         <h2 style="color:white; text-align:center;">Train Here</h2>
#     </div>
#     """, unsafe_allow_html=True)

# # Initialize session state
# if 'counter' not in st.session_state:
#     st.session_state.counter = 0
# if 'direction' not in st.session_state:
#     st.session_state.direction = "up"  # Start with arm extended
# if 'start_time' not in st.session_state:
#     st.session_state.start_time = None
# if 'camera_started' not in st.session_state:
#     st.session_state.camera_started = False

# # Sidebar for exercise selection
# app_mode = st.sidebar.selectbox(
#     "Choose the exercise",
#     ["About", "Left Dumbbell", "Right Dumbbell", "Squats", "Pushups", "Shoulder press"]
# )

# def calculate_angle(point1, point2, point3):
#     """Calculate angle between three points"""
#     a = np.array(point1)
#     b = np.array(point2)
#     c = np.array(point3)
    
#     radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
#     angle = np.abs(radians*180.0/np.pi)
    
#     if angle > 180.0:
#         angle = 360-angle
        
#     return angle

# def process_frame(frame, model, exercise_type):
#     """Process frame and detect pose"""
#     results = model(frame)[0]
#     keypoints = results.keypoints.data[0] if len(results.keypoints.data) > 0 else None
    
#     if keypoints is not None and len(keypoints) >= 10:  # Ensure keypoints are detected
#         # Draw keypoints
#         for kp in keypoints:
#             x, y = int(kp[0]), int(kp[1])
#             cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
            
#         if exercise_type == "Left Dumbbell":
#             # Get left arm keypoints (shoulder, elbow, wrist)
#             shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))  # Left shoulder
#             elbow = (int(keypoints[7][0]), int(keypoints[7][1]))    # Left elbow
#             wrist = (int(keypoints[9][0]), int(keypoints[9][1]))    # Left wrist
            
#             # Calculate angle
#             angle = calculate_angle(shoulder, elbow, wrist)
            
#             # Count reps only for the left arm
#             if angle > 160 and st.session_state.direction == "down":
#                 st.session_state.direction = "up"  # Arm is straightened
#             if angle < 60 and st.session_state.direction == "up":
#                 st.session_state.counter += 1  # Full rep completed
#                 st.session_state.direction = "down"  # Arm is curled
                    
#             # Draw angle
#             cv2.putText(frame, f"Angle: {int(angle)}", (10, 30),
#                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
#             # Draw rep counter
#             cv2.putText(frame, f"Reps: {int(st.session_state.counter)}", (10, 70),
#                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
#     return frame

# if app_mode == "About":
#     col1, col2 = st.columns(2)
    
#     with col1:
#         st.markdown("## Welcome to the Training Arena")
#         st.markdown("Choose the workout you wish to do from the sidebar")
#         st.write("""
#         Here are few general instructions to follow while doing the workout:
        
#         - It is necessary for you to provide web cam access. If you do not have a webcam, kindly attach an external camera.
#         - Please avoid crowded places as the model can only detect 1 person.
#         - Please ensure that the surrounding is well lit so that the camera can detect you.
#         - Please make sure the camera is focused on you based on the exercise.
        
#         With all that out of the way, it's time for you to get pumped up!
#         """)
    
#     with col2:
#         st.image("https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop", 
#                 caption="Get ready to work out!")

# elif app_mode == "Left Dumbbell":
#     st.markdown("## Left Dumbbell Curls")
    
#     # User inputs
#     weight = st.slider('What is your weight (kg)?', 20, 130, 40)
#     goal_calories = st.slider('Set a goal calorie to burn', 1, 200, 15)
    
#     # Initialize YOLO model
#     @st.cache_resource
#     def load_model():
#         return YOLO('yolov8n-pose.pt')
    
#     model = load_model()
    
#     # Start button to initiate camera
#     if not st.session_state.camera_started:
#         if st.button("Start Camera"):
#             st.session_state.camera_started = True
    
#     if st.session_state.camera_started:
#         # Video capture
#         cap = cv2.VideoCapture(0)
#         frame_placeholder = st.empty()
#         stop_button = st.button("Stop")
        
#         # Start time for workout
#         if st.session_state.start_time is None:
#             st.session_state.start_time = time.time()
        
#         while cap.isOpened() and not stop_button:
#             ret, frame = cap.read()
#             if not ret:
#                 break
                
#             # Increase frame size for better posture visibility
#             frame = cv2.resize(frame, (800, 600))  # Adjusted to 800x600
#             frame = process_frame(frame, model, "Left Dumbbell")
#             frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#             frame_placeholder.image(frame, channels="RGB")
        
#         if stop_button or not cap.isOpened():
#             cap.release()
            
#             # Calculate workout statistics
#             duration = time.time() - st.session_state.start_time
#             calories_burned = 0.25 * st.session_state.counter
            
#             st.write("---")
#             st.write("## Workout Summary")
#             st.write(f"Total Reps: {int(st.session_state.counter)}")
#             st.write(f"Duration: {int(duration)} seconds")
#             st.write(f"Calories Burned: {calories_burned:.2f} kcal")
            
#             # Create progress chart
#             fig = go.Figure()
#             fig.add_trace(go.Bar(
#                 x=['Calories'],
#                 y=[calories_burned],
#                 name='Calories Burned',
#                 marker_color='rgb(26, 118, 255)'
#             ))
#             fig.add_trace(go.Bar(
#                 x=['Calories'],
#                 y=[goal_calories],
#                 name='Goal',
#                 marker_color='rgb(55, 83, 109)'
#             ))
            
#             fig.update_layout(
#                 title='Workout Progress',
#                 xaxis_tickfont_size=14,
#                 yaxis=dict(
#                     title='Calories (kcal)',
#                     title_font_size=16,
#                     tickfont_size=14,
#                 ),
#                 legend=dict(
#                     x=0,
#                     y=1.0,
#                     bgcolor='rgba(255, 255, 255, 0)',
#                     bordercolor='rgba(255, 255, 255, 0)'
#                 ),
#                 barmode='group',
#                 bargap=0.15,
#                 bargroupgap=0.1
#             )
            
#             st.plotly_chart(fig)
            
#             # Reset session state for next workout
#             st.session_state.counter = 0
#             st.session_state.direction = "up"
#             st.session_state.start_time = None
#             st.session_state.camera_started = False


# import streamlit as st
# import cv2
# import numpy as np
# from ultralytics import YOLO
# import plotly.graph_objects as go
# import time

# # Page configuration
# st.set_page_config(page_title="Fitness Tracker", layout="wide")

# # Custom CSS for styling
# st.markdown("""
#     <style>
#     .main {
#         background-color: #f5f5f5;
#     }
#     .stButton>button {
#         background-color: #025246;
#         color: white;
#         border-radius: 5px;
#         padding: 10px 20px;
#     }
#     </style>
#     """, unsafe_allow_html=True)

# # Header
# st.markdown("""
#     <div style="background-color:#025246; padding:10px">
#         <h2 style="color:white; text-align:center;">Train Here</h2>
#     </div>
#     """, unsafe_allow_html=True)

# # Initialize session state
# if 'counter' not in st.session_state:
#     st.session_state.counter = 0
# if 'direction' not in st.session_state:
#     st.session_state.direction = "up"  # Start with arm extended
# if 'start_time' not in st.session_state:
#     st.session_state.start_time = None
# if 'camera_started' not in st.session_state:
#     st.session_state.camera_started = False

# # Sidebar for exercise selection
# app_mode = st.sidebar.selectbox(
#     "Choose the exercise",
#     ["About", "Left Dumbbell", "Right Dumbbell", "Squats", "Pushups", "Shoulder press"]
# )

# def calculate_angle(point1, point2, point3):
#     """Calculate angle between three points"""
#     a = np.array(point1)
#     b = np.array(point2)
#     c = np.array(point3)
    
#     radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
#     angle = np.abs(radians*180.0/np.pi)
    
#     if angle > 180.0:
#         angle = 360-angle
        
#     return angle

# def process_frame(frame, model, exercise_type):
#     """Process frame and detect pose"""
#     results = model(frame)[0]
#     keypoints = results.keypoints.data[0] if len(results.keypoints.data) > 0 else None
    
#     if keypoints is not None and len(keypoints) >= 10:  # Ensure keypoints are detected
#         # Draw keypoints
#         for kp in keypoints:
#             x, y = int(kp[0]), int(kp[1])
#             cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
            
#         if exercise_type == "Left Dumbbell":
#             # Get left arm keypoints (shoulder, elbow, wrist)
#             shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))  # Left shoulder
#             elbow = (int(keypoints[7][0]), int(keypoints[7][1]))    # Left elbow
#             wrist = (int(keypoints[9][0]), int(keypoints[9][1]))      # Left wrist
            
#             angle = calculate_angle(shoulder, elbow, wrist)
            
#             if angle > 160 and st.session_state.direction == "down":
#                 st.session_state.direction = "up"
#             if angle < 60 and st.session_state.direction == "up":
#                 st.session_state.counter += 1
#                 st.session_state.direction = "down"
                
#         elif exercise_type == "Right Dumbbell":
#             # Get right arm keypoints (shoulder, elbow, wrist)
#             shoulder = (int(keypoints[6][0]), int(keypoints[6][1]))  # Right shoulder
#             elbow = (int(keypoints[8][0]), int(keypoints[8][1]))    # Right elbow
#             wrist = (int(keypoints[10][0]), int(keypoints[10][1]))   # Right wrist
            
#             angle = calculate_angle(shoulder, elbow, wrist)
            
#             if angle > 160 and st.session_state.direction == "down":
#                 st.session_state.direction = "up"
#             if angle < 60 and st.session_state.direction == "up":
#                 st.session_state.counter += 1
#                 st.session_state.direction = "down"
                
#         elif exercise_type == "Squats":
#             # Get keypoints for hips and knees
#             left_hip = (int(keypoints[11][0]), int(keypoints[11][1]))
#             left_knee = (int(keypoints[13][0]), int(keypoints[13][1]))
#             left_ankle = (int(keypoints[15][0]), int(keypoints[15][1]))
            
#             right_hip = (int(keypoints[12][0]), int(keypoints[12][1]))
#             right_knee = (int(keypoints[14][0]), int(keypoints[14][1]))
#             right_ankle = (int(keypoints[16][0]), int(keypoints[16][1]))
            
#             # Calculate angles for both legs
#             left_angle = calculate_angle(left_hip, left_knee, left_ankle)
#             right_angle = calculate_angle(right_hip, right_knee, right_ankle)
#             angle = (left_angle + right_angle) / 2
            
#             if angle < 120 and st.session_state.direction == "up":
#                 st.session_state.direction = "down"
#             if angle > 160 and st.session_state.direction == "down":
#                 st.session_state.counter += 1
#                 st.session_state.direction = "up"
                
#         elif exercise_type == "Shoulder press":
#             # Get keypoints for shoulder press (both arms)
#             left_shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
#             left_elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
#             left_wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
            
#             right_shoulder = (int(keypoints[6][0]), int(keypoints[6][1]))
#             right_elbow = (int(keypoints[8][0]), int(keypoints[8][1]))
#             right_wrist = (int(keypoints[10][0]), int(keypoints[10][1]))
            
#             # Calculate angles for both arms
#             left_angle = calculate_angle(left_elbow, left_shoulder, left_wrist)
#             right_angle = calculate_angle(right_elbow, right_shoulder, right_wrist)
#             angle = (left_angle + right_angle) / 2
            
#             if angle > 160 and st.session_state.direction == "down":
#                 st.session_state.direction = "up"
#             if angle < 60 and st.session_state.direction == "up":
#                 st.session_state.counter += 1
#                 st.session_state.direction = "down"
                    
#         # Draw angle and rep counter for all exercises
#         cv2.putText(frame, f"Angle: {int(angle)}", (10, 30),
#                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
#         cv2.putText(frame, f"Reps: {int(st.session_state.counter)}", (10, 70),
#                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
#     return frame

# if app_mode == "About":
#     col1, col2 = st.columns(2)
    
#     with col1:
#         st.markdown("## Welcome to the Training Arena")
#         st.markdown("Choose the workout you wish to do from the sidebar")
#         st.write("""
#         Here are few general instructions to follow while doing the workout:
        
#         - It is necessary for you to provide web cam access. If you do not have a webcam, kindly attach an external camera.
#         - Please avoid crowded places as the model can only detect 1 person.
#         - Please ensure that the surrounding is well lit so that the camera can detect you.
#         - Please make sure the camera is focused on you based on the exercise.
        
#         With all that out of the way, it's time for you to get pumped up!
#         """)
    
#     with col2:
#         st.image("https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop", 
#                 caption="Get ready to work out!")

# else:
#     # Common setup for all exercise modes
#     st.markdown(f"## {app_mode}")
    
#     # User inputs
#     weight = st.slider('What is your weight (kg)?', 20, 130, 40)
#     goal_calories = st.slider('Set a goal calorie to burn', 1, 200, 15)
    
#     # Initialize YOLO model
#     @st.cache_resource
#     def load_model():
#         return YOLO('yolov8n-pose.pt')
    
#     model = load_model()
    
#     # Start button to initiate camera
#     if not st.session_state.camera_started:
#         if st.button("Start Camera"):
#             st.session_state.camera_started = True
    
#     if st.session_state.camera_started:
#         # Video capture
#         cap = cv2.VideoCapture(0)
#         frame_placeholder = st.empty()
#         stop_button = st.button("Stop")
        
#         # Start time for workout
#         if st.session_state.start_time is None:
#             st.session_state.start_time = time.time()
        
#         while cap.isOpened() and not stop_button:
#             ret, frame = cap.read()
#             if not ret:
#                 break
                
#             # Increase frame size for better posture visibility
#             frame = cv2.resize(frame, (800, 600))  # Adjusted to 800x600
#             frame = process_frame(frame, model, app_mode)
#             frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#             frame_placeholder.image(frame, channels="RGB")
        
#         if stop_button or not cap.isOpened():
#             cap.release()
            
#             # Calculate workout statistics
#             duration = time.time() - st.session_state.start_time
#             calories_burned = 0.25 * st.session_state.counter
            
#             st.write("---")
#             st.write("## Workout Summary")
#             st.write(f"Total Reps: {int(st.session_state.counter)}")
#             st.write(f"Duration: {int(duration)} seconds")
#             st.write(f"Calories Burned: {calories_burned:.2f} kcal")
            
#             # Create progress chart
#             fig = go.Figure()
#             fig.add_trace(go.Bar(
#                 x=['Calories'],
#                 y=[calories_burned],
#                 name='Calories Burned',
#                 marker_color='rgb(26, 118, 255)'
#             ))
#             fig.add_trace(go.Bar(
#                 x=['Calories'],
#                 y=[goal_calories],
#                 name='Goal',
#                 marker_color='rgb(55, 83, 109)'
#             ))
            
#             fig.update_layout(
#                 title='Workout Progress',
#                 xaxis_tickfont_size=14,
#                 yaxis=dict(
#                     title='Calories (kcal)',
#                     title_font_size=16,
#                     tickfont_size=14,
#                 ),
#                 legend=dict(
#                     x=0,
#                     y=1.0,
#                     bgcolor='rgba(255, 255, 255, 0)',
#                     bordercolor='rgba(255, 255, 255, 0)'
#                 ),
#                 barmode='group',
#                 bargap=0.15,
#                 bargroupgap=0.1
#             )
            
#             st.plotly_chart(fig)
            
#             # Reset session state for next workout
#             st.session_state.counter = 0
#             st.session_state.direction = "up"
#             st.session_state.start_time = None
#             st.session_state.camera_started = False
import streamlit as st
import cv2
import numpy as np
from ultralytics import YOLO
import plotly.graph_objects as go
import time

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

# Sidebar for exercise selection
app_mode = st.sidebar.selectbox(
    "Choose the exercise",
    ["About", "Left Dumbbell", "Right Dumbbell", "Squats", "Pushups", "Shoulder press"]
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

def process_frame(frame, model, exercise_type):
    """Process frame and detect pose"""
    results = model(frame)[0]
    keypoints = results.keypoints.data[0] if len(results.keypoints.data) > 0 else None
    
    if keypoints is not None and len(keypoints) >= 10:  # Ensure keypoints are detected
        # Draw keypoints
        for kp in keypoints:
            x, y = int(kp[0]), int(kp[1])
            cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
            
        if exercise_type == "Left Dumbbell":
            # Get left arm keypoints (shoulder, elbow, wrist)
            shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))  # Left shoulder
            elbow = (int(keypoints[7][0]), int(keypoints[7][1]))    # Left elbow
            wrist = (int(keypoints[9][0]), int(keypoints[9][1]))    # Left wrist
            
            angle = calculate_angle(shoulder, elbow, wrist)
            
            if angle > 160 and st.session_state.direction == "down":
                st.session_state.direction = "up"
            if angle < 60 and st.session_state.direction == "up":
                st.session_state.counter += 1
                st.session_state.direction = "down"
                
        elif exercise_type == "Right Dumbbell":
            # Get right arm keypoints (shoulder, elbow, wrist)
            shoulder = (int(keypoints[6][0]), int(keypoints[6][1]))  # Right shoulder
            elbow = (int(keypoints[8][0]), int(keypoints[8][1]))    # Right elbow
            wrist = (int(keypoints[10][0]), int(keypoints[10][1]))   # Right wrist
            
            angle = calculate_angle(shoulder, elbow, wrist)
            
            if angle > 160 and st.session_state.direction == "down":
                st.session_state.direction = "up"
            if angle < 60 and st.session_state.direction == "up":
                st.session_state.counter += 1
                st.session_state.direction = "down"
                
        elif exercise_type == "Squats":
            # Get keypoints for hips and knees
            left_hip = (int(keypoints[11][0]), int(keypoints[11][1]))
            left_knee = (int(keypoints[13][0]), int(keypoints[13][1]))
            left_ankle = (int(keypoints[15][0]), int(keypoints[15][1]))
            
            right_hip = (int(keypoints[12][0]), int(keypoints[12][1]))
            right_knee = (int(keypoints[14][0]), int(keypoints[14][1]))
            right_ankle = (int(keypoints[16][0]), int(keypoints[16][1]))
            
            # Calculate angles for both legs
            left_angle = calculate_angle(left_hip, left_knee, left_ankle)
            right_angle = calculate_angle(right_hip, right_knee, right_ankle)
            angle = (left_angle + right_angle) / 2
            
            if angle < 120 and st.session_state.direction == "up":
                st.session_state.direction = "down"
            if angle > 160 and st.session_state.direction == "down":
                st.session_state.counter += 1
                st.session_state.direction = "up"
                
        elif exercise_type == "Pushups":
            # Get keypoints for pushups (both arms and body)
            left_shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
            left_elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
            left_wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
            
            right_shoulder = (int(keypoints[6][0]), int(keypoints[6][1]))
            right_elbow = (int(keypoints[8][0]), int(keypoints[8][1]))
            right_wrist = (int(keypoints[10][0]), int(keypoints[10][1]))
            
            # Calculate angles for both arms
            left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
            right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
            angle = (left_angle + right_angle) / 2
            
            if angle > 160 and st.session_state.direction == "down":
                st.session_state.direction = "up"
            if angle < 90 and st.session_state.direction == "up":
                st.session_state.counter += 1
                st.session_state.direction = "down"
                
        elif exercise_type == "Shoulder press":
            # Get keypoints for shoulder press (both arms)
            left_shoulder = (int(keypoints[5][0]), int(keypoints[5][1]))
            left_elbow = (int(keypoints[7][0]), int(keypoints[7][1]))
            left_wrist = (int(keypoints[9][0]), int(keypoints[9][1]))
            
            right_shoulder = (int(keypoints[6][0]), int(keypoints[6][1]))
            right_elbow = (int(keypoints[8][0]), int(keypoints[8][1]))
            right_wrist = (int(keypoints[10][0]), int(keypoints[10][1]))
            
            # Calculate angles for both arms
            left_angle = calculate_angle(left_elbow, left_shoulder, left_wrist)
            right_angle = calculate_angle(right_elbow, right_shoulder, right_wrist)
            angle = (left_angle + right_angle) / 2
            
            if angle > 160 and st.session_state.direction == "down":
                st.session_state.direction = "up"
            if angle < 60 and st.session_state.direction == "up":
                st.session_state.counter += 1
                st.session_state.direction = "down"
                    
        # Draw angle and rep counter for all exercises
        cv2.putText(frame, f"Angle: {int(angle)}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        cv2.putText(frame, f"Reps: {int(st.session_state.counter)}", (10, 70),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
    return frame

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
    
    # User inputs
    weight = st.slider('What is your weight (kg)?', 20, 130, 40)
    goal_calories = st.slider('Set a goal calorie to burn', 1, 200, 15)
    
    # Initialize YOLO model
    @st.cache_resource
    def load_model():
        return YOLO('yolov8n-pose.pt')
    
    model = load_model()
    
    # Start button to initiate camera
    if not st.session_state.camera_started:
        if st.button("Start Camera"):
            st.session_state.camera_started = True
    
    if st.session_state.camera_started:
        # Video capture
        cap = cv2.VideoCapture(0)
        frame_placeholder = st.empty()
        stop_button = st.button("Stop")
        
        # Start time for workout
        if st.session_state.start_time is None:
            st.session_state.start_time = time.time()
        
        while cap.isOpened() and not stop_button:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Increase frame size for better posture visibility
            frame = cv2.resize(frame, (800, 600))  # Adjusted to 800x600
            frame = process_frame(frame, model, app_mode)
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_placeholder.image(frame, channels="RGB")
        
        if stop_button or not cap.isOpened():
            cap.release()
            
            # Calculate workout statistics
            duration = time.time() - st.session_state.start_time
            # Different calorie calculations for different exercises
            if app_mode in ["Left Dumbbell", "Right Dumbbell", "Shoulder press"]:
                calories_burned = 0.25 * st.session_state.counter
            elif app_mode == "Squats":
                calories_burned = 0.5 * st.session_state.counter
            elif app_mode == "Pushups":
                calories_burned = 0.4 * st.session_state.counter
            
            st.write("---")
            st.write("## Workout Summary")
            st.write(f"Total Reps: {int(st.session_state.counter)}")
            st.write(f"Duration: {int(duration)} seconds")
            st.write(f"Calories Burned: {calories_burned:.2f} kcal")
            
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
            
            # Reset session state for next workout
            st.session_state.counter = 0
            st.session_state.direction = "up"
            st.session_state.start_time = None
            st.session_state.camera_started = False