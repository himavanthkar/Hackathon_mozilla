
# NoteWise - Note Summarization Application

## Overview

NoteWise is a web application designed to efficiently summarize textual notes. It leverages the TinyLlama model for text summarization and incorporates Whisper for voice-to-text capabilities. The application features a React frontend, a Node.js and Express backend, and utilizes Firebase for NoSQL data storage.

**Developers:**
- [Sriman Ujhanthachhen](https://github.com/SrimanCode)
- [Himavanth Karpurapu](https://github.com/himavanthkar)

## Features

- **Text Summarization:** Utilizes the TinyLlama model to generate concise summaries of input text.
- **Voice Input:** Employs Whisper to convert voice notes into text for summarization.
- **Query Summaries:** Allows users to ask questions or query information from the generated summaries.
- **User-Friendly Interface:** Built with React and Material-UI for a responsive and intuitive user experience.
- **Data Management:** Integrates Firebase for efficient storage and retrieval of notes.

## Technologies Used

- **Frontend:** React, Material-UI
- **Backend:** Node.js, Express
- **Database:** Firebase (NoSQL)
- **Text Summarization Model:** TinyLlama
- **Voice Recognition:** Whisper

## Setup and Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/SrimanCode/hackathon.git
   cd hackathon
   ```

2. **Install Dependencies:**
   - **Backend:**
     ```bash
     cd ../backend
     npm install
     ```
   - **Frontend:**
     ```bash
     cd ../frontend
     npm install
     ```

3. **Configure Firebase:**
   - Replace the Firebase configuration in `firebase.js` with your project-specific details.

4. **Start the Application:**
   - **Backend:**
     ```bash
     cd backend
     npm start
     ```
   - **Frontend:**
     ```bash
     cd frontend
     npm start
     ```

5. **Set Up TinyLlama:**
   - **Download the TinyLlama Model:**
     - Visit the TinyLlama repository to download the model files.
   - **Install Dependencies:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Run the Model:**
     ```bash
     python summarize.py --input text_file.txt --output summary.txt
     ```

6. **Set Up Whisper for Voice Input:**
   - **Install Whisper:**
     ```bash
     pip install openai-whisper
     ```
   - **Transcribe Audio:**
     ```bash
     whisper audio_file.mp3 --model tiny
     ```

## Usage

1. **Access the Application:**
   - Navigate to `http://localhost:3000` in your browser.

2. **Summarize Text:**
   - Enter or paste text into the input field and click "Summarize" to generate a summary.

3. **Voice Input:**
   - Use the voice input feature to record audio, which will be transcribed and summarized.

4. **Query Summaries:**
   - Ask questions or query information from the generated summaries using the built-in query interface.

5. **Manage Notes:**
   - View, edit, or delete saved notes through the dashboard.

## Acknowledgments

- This project utilizes the TinyLlama model for text summarization.
- Voice recognition is powered by Whisper.
