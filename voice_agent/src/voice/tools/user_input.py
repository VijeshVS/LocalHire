from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field
from openai import OpenAI
import sounddevice as sd
import wavio
import soundfile as sf

client = OpenAI()

class TakeUserInputToolInput(BaseModel):
    """Schema for taking user input."""
    question: str = Field(..., description="The question to ask the user.")

def speak_and_play(text: str, out_path: str = "speech.mp3") -> str:
    print("🔊 Generating speech...")

    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice="coral",
        input=text,
    ) as response:
        response.stream_to_file(out_path)

    print(f"✔ Saved to {out_path}")

    data, fs = sf.read(out_path, dtype="int16")
    sd.play(data, fs)
    sd.wait()

    print("▶ Playback finished.")
    return out_path

def record_audio(duration=5, out_path="spoken_answer.wav"):
    print("🎤 Speak your answer now...")
    fs = 44100
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()
    wavio.write(out_path, audio, fs, sampwidth=2)
    print("✔ Recorded.")
    return out_path

def transcribe(audio_file_path):
    with open(audio_file_path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=f,
            language="en"
        )
    return transcription.text

class TakeUserInputTool(BaseTool):
    name: str = "take_user_input"
    description: str = (
        "Ask the user a question and return their response as text."
    )
    args_schema: Type[BaseModel] = TakeUserInputToolInput

    def _run(self, question: str) -> str:
        speak_and_play(question)
        audio_file = record_audio()
        response_text = transcribe(audio_file)
        return response_text.strip()
