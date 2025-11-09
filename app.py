from flask import Flask, render_template, request, jsonify, url_for
from ultralytics import YOLO
import os

app = Flask(__name__)
model = YOLO("last.pt")

UPLOAD_FOLDER = "static/uploads"
RESULTS_FOLDER = "static/results"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            if request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({'error': 'No file part'}), 400
            return "No file part", 400
        
        file = request.files['file']
        if file.filename == '':
            if request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({'error': 'No selected file'}), 400
            return "No selected file", 400

        # Validate file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            if request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400
            return "Invalid file type", 400

        # Save uploaded file
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # Run prediction
        results = model(file_path)
        
        # Save result image
        output_filename = "result_" + file.filename
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)
        results[0].save(filename=output_path)

        # Prepare response data
        uploaded_image_url = url_for('static', filename=f'uploads/{file.filename}')
        result_image_url = url_for('static', filename=f'uploads/{output_filename}')

        # Extract detection statistics if available
        stats = {}
        if results and len(results) > 0:
            result = results[0]
            if hasattr(result, 'boxes') and result.boxes is not None:
                num_detections = len(result.boxes)
                stats['detections'] = num_detections
                
                # Get confidence scores if available
                if hasattr(result.boxes, 'conf') and result.boxes.conf is not None:
                    confidences = result.boxes.conf.cpu().numpy()
                    if len(confidences) > 0:
                        stats['avg_confidence'] = f"{confidences.mean():.2%}"
                        stats['max_confidence'] = f"{confidences.max():.2%}"

        # Check if client wants JSON response (AJAX request)
        wants_json = (
            request.is_json or 
            request.headers.get('Accept') == 'application/json' or
            request.headers.get('Content-Type') == 'application/json' or
            'application/json' in request.headers.get('Accept', '')
        )

        if wants_json:
            return jsonify({
                'success': True,
                'uploaded_image': uploaded_image_url,
                'result_image': result_image_url,
                'stats': stats
            })
        else:
            # Fallback to HTML response for traditional form submissions
            return render_template('index.html', 
                                 uploaded_image=uploaded_image_url, 
                                 result_image=result_image_url)
    
    except Exception as e:
        error_msg = str(e)
        print(f"Error in predict: {error_msg}")
        
        if request.is_json or request.headers.get('Accept') == 'application/json':
            return jsonify({'error': 'An error occurred during prediction', 'details': error_msg}), 500
        return f"Error: {error_msg}", 500

if __name__ == '__main__':
    app.run(debug=True)