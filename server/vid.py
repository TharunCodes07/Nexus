from moviepy import VideoFileClip
import speech_recognition as sr
import os

def video_to_text(video_path, output_folder):
    # Create the output directory if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    # Output paths
    output_audio_path = os.path.join(output_folder, "output_audio.wav")
    output_text_path = os.path.join(output_folder, "output_text.txt")

    def video_to_audio(video_path, output_audio_path):
        clip = VideoFileClip(video_path)
        audio = clip.audio
        audio.write_audiofile(output_audio_path)

    def audio_to_text(audio_path):
        recognizer = sr.Recognizer()
        audio = sr.AudioFile(audio_path)

        with audio as source:
            audio_data = recognizer.record(source)

            try:
                text = recognizer.recognize_whisper(audio_data)
            except sr.UnknownValueError:
                print("Speech recognition could not understand the audio.")
                text = ""
        return text

    # Check if video exists
    if not os.path.isfile(video_path):
        raise FileNotFoundError("Video file not found. Please check the path.")

    print(f"Processing video: {video_path}")
    
    # Extract audio from the video
    video_to_audio(video_path, output_audio_path)
    
    # Convert audio to text
    text_data = audio_to_text(output_audio_path)
    
    # Save the text data to a file
    with open(output_text_path, "w") as file:
        file.write(text_data)
    print(f"Text data saved to {output_text_path}")
    
    # Clean up the audio file
    os.remove(output_audio_path)
    print("Intermediate audio file removed.")
    
    return text_data
