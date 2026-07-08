
# Load a small pre-trained YOLOv8 model


# Train the model
# model.train(
#     data='dataset/data.yaml',  # Path to your YAML
#     epochs=20,
#     imgsz=640,
#     batch=8
# ) 


# testing the dataset 
# results = model.val(data='dataset/data.yaml')
# print(results)  

# testing the model on an image

from ultralytics import YOLO

model = YOLO('last.pt')
results = model.train(resume=True)