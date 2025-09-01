import streamlit as st
import numpy as np
import plotly.graph_objects as go
import time
import math

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
        <h2 style="color:white; text-align:center;">Train Here - Demo Version</h2>
    </div>
    """, unsafe_allow_html=True)

# Initialize session state
if 'counter' not in st.session_state:
    st.session_state.counter = 0
if 'start_time' not in st.session_state:
    st.session_state.start_time = None
if 'workout_started' not in st.session_state:
    st.session_state.workout_started = False

# Sidebar for exercise selection
app_mode = st.sidebar.selectbox(
    "Choose the exercise",
    ["About", "Left Dumbbell", "Right Dumbbell", "Lateral Raises", "Front Raises", "Triceps Kickbacks"]
)

if app_mode == "About":
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("## Welcome to the Training Arena")
        st.markdown("Choose the workout you wish to do from the sidebar")
        st.write("""
        **Note: This is a demo version without camera functionality.**
        
        Here are few general instructions to follow while doing the workout:

        - This demo version simulates workout tracking
        - Click "Start Workout" to begin simulated exercise
        - Use the manual counter to track your reps
        - The app will calculate calories burned

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

    # Manual rep counter
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("Add Rep"):
            st.session_state.counter += 1
            st.rerun()
    
    with col2:
        if st.button("Reset Counter"):
            st.session_state.counter = 0
            st.session_state.start_time = None
            st.session_state.workout_started = False
            st.rerun()
    
    with col3:
        if st.button("Start Workout") and not st.session_state.workout_started:
            st.session_state.workout_started = True
            st.session_state.start_time = time.time()
            st.rerun()

    # Display current stats
    if st.session_state.workout_started:
        duration = time.time() - st.session_state.start_time
        
        # Different calorie calculations for different exercises
        if app_mode in ["Left Dumbbell", "Right Dumbbell"]:
            calories_burned = 0.25 * st.session_state.counter
        elif app_mode in ["Lateral Raises", "Front Raises"]:
            calories_burned = 0.3 * st.session_state.counter
        elif app_mode == "Triceps Kickbacks":
            calories_burned = 0.2 * st.session_state.counter
        
        st.write("---")
        st.write("## Current Workout Stats")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Reps", st.session_state.counter)
        with col2:
            st.metric("Duration", f"{int(duration)}s")
        with col3:
            st.metric("Calories", f"{calories_burned:.2f} kcal")
        
        # Progress chart
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
        
        # Feedback
        if calories_burned >= goal_calories:
            st.success("🎉 Congratulations! You've reached your goal!")
        elif calories_burned >= goal_calories * 0.8:
            st.info("💪 Almost there! Keep going!")
        else:
            st.warning("🔥 Keep pushing! You can do it!")
    else:
        st.info("Click 'Start Workout' to begin tracking your exercise!")
