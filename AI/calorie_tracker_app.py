import streamlit as st

st.set_page_config(page_title="Calorie Tracker", layout="wide")

st.title("Food Image Calorie Tracker")

uploaded_file = st.file_uploader("Upload an image of your food", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    st.image(uploaded_file, caption="Uploaded Food Image", use_column_width=True)
    st.success("Image uploaded successfully!")
    # Here we will add the logic for food recognition and calorie tracking
