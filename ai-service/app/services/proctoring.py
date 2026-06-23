import random
from typing import Optional


async def analyze_frame(image_base64: Optional[str] = None) -> dict:
    """Analyze webcam frame for engagement. Returns heuristic scores (demo mode without ML model)."""
    if not image_base64:
        return {
            "engagement_score": 0,
            "attention_level": "unknown",
            "dominant_emotion": "unknown",
            "face_detected": False,
        }

    has_data = len(image_base64) > 100
    engagement = random.randint(70, 95) if has_data else random.randint(40, 60)

    return {
        "engagement_score": engagement,
        "attention_level": "high" if engagement >= 75 else "medium" if engagement >= 55 else "low",
        "dominant_emotion": random.choice(["neutral", "focused", "confident"]),
        "face_detected": has_data,
    }
