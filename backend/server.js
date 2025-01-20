const express = require("express");
PORT = 5000;
const app = express();
const { spawn } = require("child_process");
app.use(express.json());
const cors = require("cors");

app.use(cors());

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// function to transcribe audio to text
async function transcribeAudioWithPython(audioFilePath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      "whisper_transcribe.py",
      audioFilePath,
    ]);

    let transcription = "";

    // Stream stdout
    pythonProcess.stdout.on("data", (data) => {
      process.stdout.write(data); // Print real-time transcription (optional)
      transcription += data.toString();
    });

    // Stream stderr
    pythonProcess.stderr.on("data", (error) => {
      console.error("Error from Python:", error.toString());
    });

    // Handle process exit
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(transcription.trim());
      } else {
        reject(new Error(`Python process exited with code ${code}`));
      }
    });

    // Handle potential spawn errors
    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      reject(error);
    });
  });
}

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const transcript = await transcribeAudioWithPython(req.file.path);
    res.send({ transcript: transcript });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    res.status(500).send({ error: "Transcription failed." });
  }
});

const prompt = `You are an AI language model tasked with creating a highly structured bullet points summary description of a lecture. Follow these instructions precisely to ensure the summary is well-organized and easy to understand:

1. Use **bullet points** to organize information logically and concisely.

2. Maintain a logical flow and coherence between sections. Avoid redundancy or repetition.

3. Present the summary in a professional and informative tone.

Here is the lecture transcript for summarization:
<Insert transcript here>`;

app.post("/summarize", async (req, res) => {
  const { userPrompt } = req.body;
  try {
    const response = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer no-key",
      },
      body: JSON.stringify({
        model: "LLaMA_CPP",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return res.status(500).send("Failed to generate response");
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Malformed response:", data);
      return res.status(500).send("Failed to process response");
    }
    res.send({
      summary: content,
    });
  } catch (error) {
    console.error("Unexpected Error:", error);
    res.status(500).send("Failed to generate response");
  }
});

app.post("/get_answers", async (req, res) => {
  const userPrompt = req.body.userPrompt;
  const summary = req.body.summary;

  const Prompt_1 = `You are an AI language tasked with answering the following questions based on the provided text.
  Provide clear, concise, and accurate responses in complete sentences, avoiding unnecessary elaboration. Here is the text you need to refer to:
  ${summary}`;

  const conciseUserPrompt = `Answer concisely and accurately and in 1 sentence: ${userPrompt}`;
  console.log(userPrompt);
  try {
    const response = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer no-key",
      },
      body: JSON.stringify({
        model: "LLaMA_CPP",
        messages: [
          {
            role: "system",
            content: Prompt_1,
          },
          {
            role: "user",
            content: conciseUserPrompt,
          },
        ],
        max_tokens: 200, // Limit to concise responses
        temperature: 0, // Deterministic
        do_samples: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return res.status(500).send("Failed to generate response");
    }

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("Malformed response:", data);
      return res.status(500).send("Failed to process response");
    }

    content = content.replace(/[\r\n]+/g, " ").trim();

    res.send({
      answer: content,
    });
  } catch (error) {
    console.error("Unexpected Error:", error);
    res.status(500).send("Failed to generate response");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
