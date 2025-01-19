import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  IconButton,
  Collapse,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";

import { Card, CardContent, CardActions } from "@mui/material";
import {
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  Search,
  Mic,
  MicOff,
} from "@mui/icons-material";

import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  doc,
} from "firebase/firestore";

const Dashboard = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  const [expandedNote, setExpandedNote] = useState(null);
  const [editNoteId, setEditNoteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5;
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const QUESTION_API_URL = "http://localhost:5000/ask";
  const TRANSCRIBE_API_URL = "http://localhost:5000/transcribe";

  // Fetch saved summaries from Firebase
  const fetchSavedNotes = async () => {
    try {
      const q = query(
        collection(db, "summaries"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedNotes(notes);
      setFilteredNotes(notes);
    } catch (error) {
      console.error("Error fetching saved notes:", error);
    }
  };

  useEffect(() => {
    fetchSavedNotes();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchText, savedNotes]);

  const handleSearch = () => {
    const filtered = savedNotes.filter((note) =>
      note.summary.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredNotes(filtered);
    setCurrentPage(1);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      recordedChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(recordedChunks.current, {
          type: "audio/webm",
        });
        recordedChunks.current = [];

        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.webm");

        try {
          const response = await fetch(TRANSCRIBE_API_URL, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          setInputText((inputText + "\n" + data.transcript).trim());
          showSnackbar("Voice transcription completed!", "success");
        } catch (error) {
          console.error("Error transcribing audio:", error);
          showSnackbar("Error transcribing audio", "error");
        }
      };

      setIsRecording(false);
    }
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: inputText }),
      });
      const data = await response.json();
      const summary = data.summary;
      setOutputText(summary);
    } catch (error) {
      console.error("Error summarizing text:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      if (editNoteId) {
        const docRef = doc(db, "summaries", editNoteId);
        await updateDoc(docRef, { summary: outputText, timestamp: new Date() });
        setSavedNotes((prev) =>
          prev.map((note) =>
            note.id === editNoteId
              ? { ...note, summary: outputText, timestamp: new Date() }
              : note
          )
        );
        setEditNoteId(null);
        showSnackbar("Note updated successfully", "success");
      } else {
        const newNote = { summary: outputText, timestamp: new Date() };
        const docRef = await addDoc(collection(db, "summaries"), newNote);
        setSavedNotes((prev) => [{ id: docRef.id, ...newNote }, ...prev]);
        showSnackbar("Note saved successfully", "success");
      }
      setOutputText("");
    } catch (error) {
      console.error("Error saving summary:", error);
      showSnackbar("Error saving note", "error");
    }
  };

  const handleDeleteSummary = async (id) => {
    try {
      const docRef = doc(db, "summaries", id);
      await deleteDoc(docRef);
      setSavedNotes((prev) => prev.filter((note) => note.id !== id));
      showSnackbar("Note deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting summary:", error);
      showSnackbar("Error deleting note", "error");
    }
  };

  const handleEditSummary = (id, summary) => {
    setEditNoteId(id);
    setOutputText(summary);
  };

  const toggleExpandNote = (id) => {
    setExpandedNote((prev) => (prev === id ? null : id));
  };

  const handleAskQuestion = async () => {
    try {
      const questionKeywords = question.toLowerCase().split(" ");

      // Rank summaries based on the number of matching keywords
      const rankedNotes = savedNotes
        .map((note) => {
          const keywordMatches = questionKeywords.filter((keyword) =>
            note.summary.toLowerCase().includes(keyword)
          ).length;
          return { ...note, keywordMatches };
        })
        .filter((note) => note.keywordMatches > 0)
        .sort((a, b) => b.keywordMatches - a.keywordMatches);

      // Combine relevant summaries
      const combinedText = rankedNotes.map((note) => note.summary).join("\n");

      if (!combinedText) {
        setAnswer("No relevant information found in saved notes.");
        return;
      }
      setIsGeneratingAnswer(true);
      // Making the API request
      const response = await fetch("http://localhost:5000/get_answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: combinedText, userPrompt: question }),
      });
      setIsGeneratingAnswer(false);
      const data = await response.json();
      setAnswer(data.answer.slice(0, -4) || "No response available.");
    } catch (error) {
      console.error("Error generating answer:", error);
      setAnswer("Error generating answer. Please try again.");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  );

  return (
    <Grid container sx={{ height: "100vh" }}>
      {/* Left Column: Previous Notes */}
      <Grid
        item
        xs={3}
        sx={{ backgroundColor: "#f5f5f5", padding: 2, overflowY: "auto" }}
      >
        <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
          Previous Notes
        </Typography>
        <TextField
          placeholder="Search Notes"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ marginRight: 1 }} />,
          }}
          sx={{ marginBottom: 2 }}
        />
        <List>
          {paginatedNotes.map((note) => (
            <ListItem key={note.id} divider>
              <Box sx={{ width: "100%" }}>
                <Box display="flex" justifyContent="space-between">
                  <ListItemText
                    primary={note.summary.substring(0, 50) + "..."}
                    secondary={new Date(
                      note.timestamp.seconds * 1000
                    ).toLocaleString()}
                  />
                  <Box>
                    <IconButton
                      onClick={() => toggleExpandNote(note.id)}
                      size="small"
                    >
                      {expandedNote === note.id ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditSummary(note.id, note.summary)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteSummary(note.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                <Collapse in={expandedNote === note.id}>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", marginTop: 1 }}
                  >
                    {note.summary}
                  </Typography>
                </Collapse>
              </Box>
            </ListItem>
          ))}
        </List>
        <Pagination
          count={Math.ceil(filteredNotes.length / notesPerPage)}
          page={currentPage}
          onChange={(e, value) => setCurrentPage(value)}
          sx={{ marginTop: 2 }}
        />
      </Grid>

      {/* Right Column: Main Content */}
      <Grid item xs={9} sx={{ padding: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">
            Note Summarization Dashboard
          </Typography>
          <Button
            variant="contained"
            color={isRecording ? "error" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
            startIcon={isRecording ? <MicOff /> : <Mic />}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </Box>

        {/* Input Text */}
        <Paper sx={{ padding: 2, marginBottom: 3 }}>
          <Typography variant="h6">Input Notes or Speech</Typography>
          <TextField
            id="input-notes"
            label="Enter Notes"
            variant="outlined"
            multiline
            rows={10}
            fullWidth
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <Box sx={{ marginTop: 2, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSummarize}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Summarize"
              )}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveSummary}
              disabled={!outputText}
            >
              {editNoteId ? "Update" : "Save"}
            </Button>
          </Box>
        </Paper>

        {/* Output Text */}
        <Paper sx={{ padding: 2, marginBottom: 3 }}>
          <Typography variant="h6">Summarized Notes</Typography>
          <TextField
            id="output-summary"
            label="Summary"
            variant="outlined"
            multiline
            rows={14}
            fullWidth
            value={outputText}
            InputProps={{ readOnly: true }}
          />
        </Paper>

        {/* Question Box */}
        <Paper sx={{ padding: 2, marginBottom: 3 }}>
          <Typography variant="h6">Ask Questions About the Summary</Typography>
          <TextField
            id="question-box"
            label="Enter Your Question"
            variant="outlined"
            multiline
            rows={2}
            fullWidth
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button
            variant="contained"
            color="secondary"
            sx={{ marginTop: 2 }}
            onClick={handleAskQuestion}
            disabled={isGeneratingAnswer}
          >
            {isGeneratingAnswer ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Generate Answer"
            )}
          </Button>
        </Paper>

        {/* Display Answer */}
        <Box sx={{ marginBottom: 3 }}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Answer
              </Typography>
              <TextField
                id="answer-box"
                placeholder="The answer will appear here..."
                variant="outlined"
                multiline
                rows={4}
                fullWidth
                value={answer}
                InputProps={{
                  readOnly: true,
                  sx: { fontSize: "1rem", padding: 2 },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    borderColor: "primary.main",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default Dashboard;
