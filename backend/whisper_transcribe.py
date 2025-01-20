import whisper
import sys
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

model = whisper.load_model("base") 
audio_path = sys.argv[1] 
result = model.transcribe(audio_path, fp16=False)
print(result["text"]) 
