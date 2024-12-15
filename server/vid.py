from moviepy import VideoFileClip
import speech_recognition as sr
import os
import llama_parse
from llama_parse import LlamaParse
import nest_asyncio

nest_asyncio.apply()



def pdf_to_text(pdf):
    path = f"D:/Coding/next/nexus/public/chat/{pdf}"
    print(path)
    document = LlamaParse(result_type = "markdown").load_data(path)
    final_text = "\n\n".join(doc.text for doc in document)
    return final_text



def video_to_text(video_path):
    print('done0')
    full_video_path = f"D:/Coding/next/nexus/public/chat/{video_path}"
    
    # Create audio path in the same directory as video
    audio_filename = os.path.splitext(video_path)[0] + "_audio.wav"
    temp_audio_path = f"D:/Coding/next/nexus/public/chat/{audio_filename}"
    
    # Extract audio and save it
    clip = VideoFileClip(full_video_path)
    audio = clip.audio
    audio.write_audiofile(temp_audio_path)
    clip.close()
    
    # Convert audio to text
    recognizer = sr.Recognizer()
    with sr.AudioFile(temp_audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_whisper(audio_data)
        except sr.UnknownValueError:
            print("Speech recognition could not understand the audio.")
            text = ""
            
    # Clean up temporary file
    os.remove(temp_audio_path)
    
    return text
