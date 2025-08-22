import React from 'react';

const CalorieTracker = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="http://localhost:8501" // URL of your Streamlit app
        title="Calorie Tracker"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default CalorieTracker;

