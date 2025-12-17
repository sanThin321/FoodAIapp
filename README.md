# 🍽️ FoodAIApp

FoodAIApp is an AI-powered application that detects food items using a YOLO-based computer vision model and automatically generates recipes based on the detected ingredients. The system integrates **TensorFlow.js**, **YOLO**, and a **Hugging Face Transformer model** to provide an end-to-end intelligent food recognition and recipe generation experience.

---

## 🚀 Overview

The core idea of FoodAIApp is to:

1. Detect food items from images using a YOLO model running in **TensorFlow.js**.
2. Send the detected food items to a backend service.
3. Generate meaningful recipes using a **Transformer-based NLP model**.
4. Return the generated recipe to the user in a clean and user-friendly format.

This project bridges **computer vision** and **natural language processing** into a single practical application.

---

## 🧠 Model Architecture & Workflow

### 🔍 Food Detection (Frontend)

* The food detection model is based on **YOLO**.
* The original YOLO model was:

  * Converted from **ONNX → TensorFlow**
  * Then converted from **TensorFlow → TensorFlow.js** for browser / React Native compatibility.
* The TensorFlow.js model runs directly on the client side to perform real-time food detection.

### 🧾 Recipe Generation (Backend)

* Detected food items are sent from the frontend to the backend API.
* The backend uses a **Transformer-based model** for recipe generation.
* Model used:

  * **T5 Recipe Generation Model** from Hugging Face
  * 🔗 [https://huggingface.co/flax-community/t5-recipe-generation](https://huggingface.co/flax-community/t5-recipe-generation)
* The backend processes the detected ingredients and generates a complete recipe.

---

## 🛠️ Tech Stack

### Frontend

* React / React Native
* TensorFlow.js
* YOLO (converted model)

### Backend

* Node.js / Python (depending on implementation)
* Hugging Face Transformers
* REST API for communication between frontend and backend

### Machine Learning

* YOLO (object detection)
* ONNX
* TensorFlow
* TensorFlow.js
* Transformer (T5-based recipe generation)

---

## 🔄 Model Conversion Pipeline

```text
YOLO Model → ONNX → TensorFlow → TensorFlow.js
```

This pipeline allows the model to be efficiently deployed in a JavaScript-based environment while maintaining detection accuracy.

---

## 📚 References & Inspiration

This project was developed with guidance and reference from the following repository:

* 🔗 [https://github.com/Hyuto/yolov5-tfjs-react-native](https://github.com/Hyuto/yolov5-tfjs-react-native)

The repository provided valuable insights into deploying YOLO models using TensorFlow.js in React Native environments.

---

## ✨ Key Features

* Real-time food detection
* Client-side inference using TensorFlow.js
* AI-generated recipes using Transformer models
* Seamless frontend-backend integration
* Scalable and modular architecture

---

## 📌 Future Improvements

* Improve food detection accuracy with custom-trained datasets
* Support multiple recipe styles (vegan, keto, etc.)
* Add nutritional analysis
* Deploy backend as a cloud service

---

## 👩‍💻👨‍💻 Author

Developed as part of an AI-driven application project combining **Deep Learning**, **Computer Vision**, and **Natural Language Processing**.
