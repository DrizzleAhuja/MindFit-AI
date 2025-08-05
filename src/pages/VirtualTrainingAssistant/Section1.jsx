import React from 'react';

const VirtualTrainingAssistant = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="http://localhost:8502" // URL of your Streamlit app
        title="Virtual Training Assistant"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default VirtualTrainingAssistant;

