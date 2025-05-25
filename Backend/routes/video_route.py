from flask import Blueprint, request, jsonify, current_app
from services.video import generate_slideshow_from_poem
import os

video_bp = Blueprint("video", __name__)

@video_bp.route("/video", methods=["POST"])
def handle_generate_video():
    data = request.get_json()
    poem = data.get("poem")
    audio_path = data.get("audio_path")

    if not poem or not audio_path:
        return jsonify({"error": "Both 'poem' and 'audio_path' are required"}), 400

    try:
        # 오디오 디렉토리 추출
        audio_dir_url = audio_path[0]
        audio_subdir = os.path.dirname(audio_dir_url.replace("/static/output/", "").lstrip("/"))
        full_audio_path = os.path.join(current_app.config["AUDIO_FOLDER"], audio_subdir)

        # 정렬된 오디오 파일 리스트
        audio_files = sorted([
            os.path.join(full_audio_path, f)
            for f in os.listdir(full_audio_path)
            if f.endswith(".wav")
        ])

        # 영상 생성
        video_path = generate_slideshow_from_poem(poem, audio_files, current_app.config)
        return jsonify({"video_url": video_path})

    except Exception as e:
        print(f"❌ 영상 생성 오류: {e}")
        return jsonify({"error": str(e)}), 500
