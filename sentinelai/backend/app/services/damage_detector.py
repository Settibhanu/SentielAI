"""
YOLOv8 damage detector.
Loads yolov8n_rdd2022.pt (fine-tuned on Road Damage Detection 2022 dataset).

Model download:
  Place the .pt file at: backend/ml/yolov8n_rdd2022.pt
  Source: https://github.com/sekilab/RoadDamageDetector
"""
import os
from pathlib import Path
from typing import Optional

# Lazy import — ultralytics is only loaded when the model is first used
_model = None
MODEL_PATH = Path(__file__).parent.parent.parent / "ml" / "yolov8n_rdd2022.pt"


def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"YOLOv8 model not found at {MODEL_PATH}. "
                "Download yolov8n_rdd2022.pt from HuggingFace and place it in backend/ml/"
            )
        _model = YOLO(str(MODEL_PATH))
    return _model


def detect_damage(image_path: str) -> list[dict]:
    """
    Run YOLOv8 inference on a road image.

    Returns:
        List of detections, each with:
          - class: damage type string
          - confidence: float 0–1
          - severity_score: float 0–10
    """
    model = _get_model()
    results = model(image_path)
    detections = []
    for box in results[0].boxes:
        detections.append({
            "class": model.names[int(box.cls)],
            "confidence": round(float(box.conf), 3),
            "severity_score": _compute_severity(box),
        })
    return detections


def _compute_severity(box) -> float:
    """
    Estimate severity from bounding box area and confidence.
    Larger box relative to 640×640 input = more severe damage.
    """
    xywh = box.xywh[0]
    area_ratio = float(xywh[2] * xywh[3]) / (640 * 640)
    confidence = float(box.conf)
    return round(min(10.0, area_ratio * 100 + confidence * 3), 1)
