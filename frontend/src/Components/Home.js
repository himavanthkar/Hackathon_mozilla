import React from 'react';
import { Link } from 'react-router-dom'; // Import React Router's Link
import { Button, Typography } from '@mui/material'; // Import Material-UI components

const Home = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {/* Welcome Message */}
      <Typography variant="h3" gutterBottom>
        Welcome to Note Summarization
      </Typography>

      {/* Description */}
      <Typography variant="body1" gutterBottom>
        Use this tool to summarize your notes or speech transcriptions and manage notifications.
      </Typography>

      {/* Navigation Button */}
      <Button
        variant="contained"
        color="primary"
        component={Link} // Link to the Dashboard
        to="/dashboard" // Route to navigate to
        style={{ marginTop: '20px' }}
      >
        Go to Dashboard
      </Button>
    </div>
  );
};

export default Home;

