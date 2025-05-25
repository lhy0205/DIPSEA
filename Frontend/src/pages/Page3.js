import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { Mic, Refresh, ExpandMore } from '@mui/icons-material';
import '../styles/Page3.css';

function Page3() {
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('page3Messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [isRecording, setIsRecording] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(messages.length);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    const isNewMessageAdded = messages.length > prevMessagesLength.current;
    if (isNewMessageAdded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
    sessionStorage.setItem('page3Messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  

  const uploadAudioToServer = async (blob) => {
  const formData = new FormData();
  formData.append('file', blob, `recording_${Date.now()}.wav`);
  setLoading(true);

  try {
    // 1. STT 변환
    const sttRes = await fetch('http://localhost:5000/stt', {
      method: 'POST',
      body: formData,
    });
    const { transcript } = await sttRes.json();

    // 2. 감정 분석
    const emotionRes = await fetch('http://localhost:5000/emotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcript }),
    });
    const { emotion } = await emotionRes.json();

    // 3. 시 생성
    const poemRes = await fetch('http://localhost:5000/poem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcript, emotion }),
    });
    const { poem } = await poemRes.json();

    // 4. 영상 추천
    const videoRes = await fetch('http://localhost:5000/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcript, emotion }),
    });
    const { video_url } = await videoRes.json();

    // 메시지 추가
    setMessages((prev) => [
      ...prev,
      {
        user: transcript,
        poem: poem || '⚠️ 시 생성 실패',
        videoUrl: video_url || null,
        showResult: true,
      },
    ]);
  } catch (err) {
    console.error('오류 발생:', err);
    alert('음성 → 시 생성 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};


  const toggleVoiceRecording = async () => {
    if (isRecording) {
      window.recognition?.stop();
      window.mediaRecorder?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return alert("브라우저가 음성 인식을 지원하지 않습니다.");

      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.onresult = (e) => console.log("브라우저 인식:", e.results[0][0].transcript);
      recognition.onerror = (e) => { console.error("인식 오류:", e.error); recognition.stop(); setIsRecording(false); };
      recognition.onend = () => mediaRecorder.state !== 'inactive' && mediaRecorder.stop();

      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        await uploadAudioToServer(blob);
        setIsRecording(false);
      };

      window.mediaRecorder = mediaRecorder;
      window.recognition = recognition;

      mediaRecorder.start();
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      alert("녹음 오류: " + err.message);
      setIsRecording(false);
    }
  };

  const toggleResult = (index) => {
    setMessages((prev) =>
      prev.map((msg, i) => i === index ? { ...msg, showResult: !msg.showResult } : msg)
    );
  };

  const handleReset = () => {
    if (window.confirm('정말 초기화하시겠습니까?')) {
      setMessages([]);
      sessionStorage.removeItem('page3Messages');
    }
  };

  const handleTTS = (text, index) => {
    const synth = window.speechSynthesis;
    if (speakingIndex === index) {
      synth.cancel();
      setSpeakingIndex(null);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      synth.cancel();
      synth.speak(utterance);
      setSpeakingIndex(index);
      utterance.onend = () => setSpeakingIndex(null);
    }
  };

  return (
    <Box className="page3-container">
      <Box className="page3-top-toolbar">
        <Box className="page3-toolbar-left">
          <Mic fontSize="small" />
          <Typography variant="subtitle1" fontSize={14}>음성 변환</Typography>
        </Box>
        <IconButton onClick={handleReset} className="page3-reset-button">
          <Refresh fontSize="small" />
        </IconButton>
      </Box>

      <Box className="page3-messages-container">
        <Box className="page3-messages-inner">
          {messages.map((msg, idx) => (
            <Box key={idx} className="page3-message-block">
              <Paper elevation={0} className="page3-message-paper">
                <Typography className="page3-message-text">{msg.user}</Typography>
              </Paper>
              <Box className="page3-response-message">
                <Paper elevation={0} className="page3-message-paper-bot">
                  <Typography className="page3-message-text">{msg.poem}</Typography>
                </Paper>
              </Box>
              <Box className="page3-button-row">
                <Button onClick={() => handleTTS(msg.user, idx)} className="page3-listen-button" variant="contained">
                  {speakingIndex === idx ? '🔊 중지' : '🔊 듣기'}
                </Button>
              </Box>
              {msg.showResult && msg.videoUrl && (
                <Box className="page3-video-container">
                  {/*<iframe
                    width="100%" height="350"
                    src={msg.videoUrl}
                    title="추천 동영상"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen style={{ border: 'none' }}
                  />*/}
                  <video
                  controls
                  style={{ borderRadius: '12px', maxWidth: '100%' }}
                  >
                    <source src={msg.videoUrl} type="video/mp4" />
                    브라우저가 video 태그를 지원하지 않습니다.
                  </video>
                </Box>
              )}
              <Box className="page3-toggle-button">
                <IconButton size="small" onClick={() => toggleResult(idx)} style={{
                  transform: msg.showResult ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s', color: '#555',
                }}>
                  <ExpandMore fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
          {loading && (
            <Box className="page3-loading-container">
              <CircularProgress size={64} sx={{ color: '#e5d9fc' }} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      <Box className="page3-record-button-container">
        <Button
          onClick={toggleVoiceRecording}
          variant="contained"
          className="page3-record-button"
          color={isRecording ? 'error' : 'primary'}
        >
          {isRecording ? '🛑 종료' : '🎤 말하기'}
        </Button>
      </Box>
    </Box>
  );
}

export default Page3;