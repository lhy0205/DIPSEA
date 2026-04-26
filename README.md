# DIPSEA

Deep-learning model for interacting with poetry, sound, emotion and animation.

## 1. 프로젝트 소개
DIPSEA는 사용자의 음성 입력을 기반으로 감정을 분석하고,
해당 감정에 맞는 시를 생성한 뒤 음성 합성과 영상/애니메이션 형태로 출력하는 AI 융합 프로젝트입니다.

## 2. 개발 목적
감정 기반 음성 합성을 활용하여 사용자가 자신의 감정을 더 직관적으로 표현하고,
개인화된 콘텐츠를 제공받을 수 있는 소통 도구를 개발하는 것을 목표로 합니다.

## 3. 주요 기능
- 음성 입력 기반 STT
- 텍스트 감정 분석
- 감정 기반 시 생성
- 감정별 음성 합성 TTS
- 결과 영상 생성

## 4. 시스템 구조
사용자 음성 입력
→ STT 변환
→ 감정 분석
→ 시 생성
→ TTS 음성 합성
→ 영상 생성
→ 최종 콘텐츠 출력

## 5. 사용 기술
- Python
- Flask
- OpenAI Whisper
- Bi-LSTM + Attention
- EXAONE / LLM Fine-tuning
- Typecast TTS API
- MoviePy
- OpenCV
- HTML/CSS/JavaScript

## 6. AI 모델
### STT
OpenAI Whisper 기반 음성 인식 모델을 사용했습니다.

### 감정 분석
Bi-LSTM + Attention 모델을 활용하여 텍스트의 감정을 분류했습니다.

### 시 생성
EXAONE 계열 모델을 기반으로 감정 표현, 운율, 시적 구조를 반영하도록 Fine-tuning했습니다.

### TTS
Typecast TTS API를 사용하여 감정별 음성 스타일을 적용했습니다.

## 7. 실행 방법

```bash
git clone https://github.com/lhy0205/DIPSEA.git
cd DIPSEA
pip install -r requirements.txt
python app.py
