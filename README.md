# 🧠 Acne Detection Web App

A deep learning-based web application that detects acne lesions from facial images using a YOLOv8 model.  
Built with **Flask**, **Python**, and **OpenCV** — this app allows users to upload an image and get acne detection results directly in the browser.

---

## 🚀 Features

- Upload any face image and detect acne spots in real-time
- Built using **YOLOv8** for object detection
- Clean, modern, gradient-styled web interface
- Lightweight Flask backend — easy to deploy on local or cloud servers

---

## 🛠️ Tech Stack

- **Backend:** Flask (Python)
- **Model:** YOLOv8 (Ultralytics)
- **Frontend:** HTML + CSS (custom gradient design)
- **Libraries:** OpenCV, NumPy, Pillow, Torch

---

## 📂 Project Structure

📁 acne-detection-app/
│
├── app.py # Flask backend
├── train_model.py # Model training script
│
├── dataset/ # YOLO-format dataset folder
│ └── data.yaml
│
├── runs/ # YOLO training runs (optional)
│
├── templates/
│ └── index.html # Main HTML interface
│
├── static/
│ ├── style.css # Frontend styling (gradient UI)
│ ├── script.js # JavaScript for UI behavior
│ ├── uploads/ # Uploaded images
│ └── results/ # Processed output images
│
├── yolov8n.pt
├── last.pt
├── requirements.txt
└── README.md
