
from flask import Flask, render_template, request
from ultralytics import YOLO
import os

app = Flask(__name__)
model = YOLO("last.pt")

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return "No file part"
    file = request.files['file']
    if file.filename == '':
        return "No selected file"

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    results = model(file_path)
    output_path = os.path.join(UPLOAD_FOLDER, "result_" + file.filename)
    results[0].save(filename=output_path)

    return render_template('index.html', uploaded_image=file_path, result_image=output_path)

if __name__ == '__main__':
    app.run(debug=True)