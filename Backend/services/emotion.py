import numpy as np
from kiwipiepy import Kiwi
from keras_preprocessing.sequence import pad_sequences
from keras.models import load_model
import joblib
import pickle
import torch
import tensorflow as tf

device = "/GPU:0" if tf.config.list_physical_devices('GPU') else "/CPU:0"
print(f"Device set to use: {device}")

tokenizer = pickle.load(open("models/emotion/tokenizer.pkl", "rb"))
le_main = joblib.load("models/emotion/label_encoder_main.pkl")
kiwi = Kiwi()


with tf.device(device):
    model_main = load_model("models/emotion/main_bilstm_2.keras", compile=False)

print("감정 분석 모델 로드 완료")

def analyze_emotion(text: str) -> str:
    tokens = [token.form for token in kiwi.tokenize(text)]
    seq = tokenizer.texts_to_sequences([" ".join(tokens)])
    padded = pad_sequences(seq, maxlen=50, padding='post')


    with tf.device(device):
        main_pred = model_main.predict(padded, verbose=0)[0]

    main_label = le_main.inverse_transform([np.argmax(main_pred)])[0]

    return main_label
