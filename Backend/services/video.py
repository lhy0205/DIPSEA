import os
import uuid
import requests
from PIL import Image
from io import BytesIO
from pydub import AudioSegment
from moviepy.editor import ImageClip, AudioFileClip, concatenate_audioclips, concatenate_videoclips
import openai

openai.api_key = os.getenv("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")  # 환경변수 사용 권장


# ✅ GPT로 시 전체 → 줄별 프롬프트 생성
def generate_prompts_from_full_poem(poem: str) -> list:
    system_msg = (
        "You're a poetic image prompt designer for DALL·E. Given a Korean poem, "
        "generate one image generation prompt per line. Use consistent tone, symbolic imagery, "
        "soft cinematic lighting, and minimalist digital art style."
    )
    user_msg = f"Here is the poem:\n\n{poem}\n\nReturn a numbered list of image prompts, one for each line."

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.7
        )
        content = response['choices'][0]['message']['content'].strip()
        prompts = [line.split('.', 1)[-1].strip() for line in content.splitlines() if line.strip()]
        return prompts
    except Exception as e:
        print(f"❌ GPT 프롬프트 생성 실패: {e}")
        return []


# ✅ DALL·E 이미지 생성
def generate_image_with_dalle(prompt: str, size="1024x1024"):
    try:
        response = openai.Image.create(prompt=prompt, n=1, size=size)
        image_url = response['data'][0]['url']
        image_response = requests.get(image_url)
        return Image.open(BytesIO(image_response.content))
    except Exception as e:
        print(f"❌ DALL·E 이미지 생성 실패: {e}")
        return None


# ✅ 슬라이드쇼 생성기
def generate_slideshow_from_poem(poem: str, audio_paths: list, config) -> str:
    lines = [line.strip() for line in poem.strip().split('\n') if line.strip()]
    if len(lines) != len(audio_paths):
        raise ValueError("시 줄 수와 오디오 파일 수가 일치하지 않습니다.")

    print("🧠 GPT 프롬프트 생성 중...")
    prompts = generate_prompts_from_full_poem(poem)
    if len(prompts) != len(lines):
        raise ValueError("GPT가 반환한 프롬프트 수가 줄 수와 다릅니다.")

    image_folder = config['IMAGE_FOLDER']
    video_folder = config['VIDEO_FOLDER']
    clips, audio_clips = [], []

    for line, prompt, audio_path in zip(lines, prompts, audio_paths):
        print(f"\n🖋️ '{line}' → GPT 프롬프트: {prompt}")
        image = generate_image_with_dalle(prompt)
        if image is None:
            image_path = os.path.join(image_folder, "default.jpg")
        else:
            image_path = os.path.join(image_folder, f"{uuid.uuid4().hex[:8]}.png")
            image.save(image_path)

        audio = AudioSegment.from_file(audio_path)
        duration = audio.duration_seconds

        img_clip = ImageClip(image_path, duration=duration).fadein(0.5).fadeout(0.5)
        clips.append(img_clip)
        audio_clips.append(AudioFileClip(audio_path))

    final_audio = concatenate_audioclips(audio_clips)
    final_video = concatenate_videoclips(clips).set_audio(final_audio)

    output_path = os.path.join(video_folder, f"slideshow_{uuid.uuid4().hex[:8]}.mp4")
    final_video.write_videofile(output_path, codec="libx264", audio_codec="aac", fps=24)

    return output_path
