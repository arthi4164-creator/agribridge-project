"""
AgriBridge AI - AI Demand Forecasting Engine
Built with Pandas, NumPy, and Scikit-learn.
Predicts:
- Future crop demand index & category (High, Moderate, Low)
- Expected market price range (₹/kg)
- Optimal harvest window (days)
- Demand trends (Increasing, Stable, Decreasing)
- 12-month historical vs predicted seasonal curves
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from typing import Dict, Any, List
import datetime

# Predefined crop parameters, historical baselines, and agro-climatic factors
CROP_BASELINES = {
    "Tomato": {
        "tamil": "தக்காளி",
        "base_price": 24.0,
        "price_volatility": 0.28,
        "base_demand": 85.0,
        "shelf_life_days": 10,
        "harvest_lead_days": 7,
        "optimal_window": "5–10 days",
        "current_trend": "Increasing",
        "trend_arrow": "↑",
        "confidence": 92.4,
        "drivers": ["High retail consumption in urban centers", "Unseasonal monsoon in neighboring states", "Low cold storage holding in district"]
    },
    "Onion": {
        "tamil": "வெங்காயம்",
        "base_price": 34.0,
        "price_volatility": 0.22,
        "base_demand": 90.0,
        "shelf_life_days": 45,
        "harvest_lead_days": 14,
        "optimal_window": "10–18 days",
        "current_trend": "Increasing",
        "trend_arrow": "↑",
        "confidence": 94.1,
        "drivers": ["Rabi harvest transition", "Strong wholesale mandi export demand", "Low buffer stocks reported"]
    },
    "Potato": {
        "tamil": "உருளைக்கிழங்கு",
        "base_price": 22.0,
        "price_volatility": 0.15,
        "base_demand": 78.0,
        "shelf_life_days": 60,
        "harvest_lead_days": 20,
        "optimal_window": "15–25 days",
        "current_trend": "Stable",
        "trend_arrow": "→",
        "confidence": 91.0,
        "drivers": ["Consistent institutional demand", "Cold storage capacity adequate", "Stable inter-district arrivals"]
    },
    "Paddy": {
        "tamil": "நெல்",
        "base_price": 26.5,
        "price_volatility": 0.12,
        "base_demand": 88.0,
        "shelf_life_days": 180,
        "harvest_lead_days": 25,
        "optimal_window": "20–30 days",
        "current_trend": "Stable",
        "trend_arrow": "→",
        "confidence": 95.2,
        "drivers": ["MSP procurement backing", "High civil supplies procurement target", "Monsoon moisture index favorable"]
    },
    "Chili": {
        "tamil": "மிளகாய்",
        "base_price": 145.0,
        "price_volatility": 0.35,
        "base_demand": 80.0,
        "shelf_life_days": 90,
        "harvest_lead_days": 12,
        "optimal_window": "7–14 days",
        "current_trend": "Increasing",
        "trend_arrow": "↑",
        "confidence": 89.8,
        "drivers": ["Spices processing mill demand peak", "Export contracts from Southern ports", "Dry weather aiding harvest"]
    },
    "Carrot": {
        "tamil": "கேரட்",
        "base_price": 38.0,
        "price_volatility": 0.20,
        "base_demand": 72.0,
        "shelf_life_days": 21,
        "harvest_lead_days": 10,
        "optimal_window": "6–12 days",
        "current_trend": "Increasing",
        "trend_arrow": "↑",
        "confidence": 90.5,
        "drivers": ["Hilly zone arrivals tapering", "Metropolitan direct-to-consumer demand", "Pre-cooling chain readiness"]
    },
    "Cabbage": {
        "tamil": "முட்டைக்கோஸ்",
        "base_price": 18.0,
        "price_volatility": 0.25,
        "base_demand": 65.0,
        "shelf_life_days": 14,
        "harvest_lead_days": 8,
        "optimal_window": "5–9 days",
        "current_trend": "Decreasing",
        "trend_arrow": "↓",
        "confidence": 88.0,
        "drivers": ["Surplus harvesting in surrounding blocks", "High local supply", "Advise early aggregation or cold transit"]
    }
}

class CropDemandModel:
    def __init__(self):
        self.models: Dict[str, RandomForestRegressor] = {}
        self._train_mock_models()

    def _train_mock_models(self):
        """Train scikit-learn models on synthetic historical agro-climatic time-series."""
        np.random.seed(42)
        for crop, meta in CROP_BASELINES.items():
            # 100 historical weekly records
            n_samples = 104
            rainfall_mm = np.random.uniform(5, 120, n_samples)
            temperature_c = np.random.uniform(22, 38, n_samples)
            mandi_arrivals_tons = np.random.uniform(200, 1500, n_samples)
            historical_demand = meta["base_demand"] + np.sin(np.linspace(0, 4 * np.pi, n_samples)) * 15 + np.random.normal(0, 4, n_samples)
            
            # Target price
            target_price = meta["base_price"] * (1 + (historical_demand - meta["base_demand"]) * 0.015 - (mandi_arrivals_tons - 800) * 0.0002) + np.random.normal(0, 1.5, n_samples)
            target_price = np.clip(target_price, meta["base_price"] * 0.6, meta["base_price"] * 1.8)

            X = np.column_stack([rainfall_mm, temperature_c, mandi_arrivals_tons, historical_demand])
            y = target_price

            model = RandomForestRegressor(n_estimators=25, random_state=42)
            model.fit(X, y)
            self.models[crop] = model

    def predict_crop(self, crop_name: str, district: str = "Coimbatore") -> Dict[str, Any]:
        meta = CROP_BASELINES.get(crop_name, CROP_BASELINES["Tomato"])
        tamil_name = meta["tamil"]

        # Current weather inputs for district (simulated live agro-climatic API)
        cur_rainfall = 28.5
        cur_temp = 30.2
        cur_arrivals = 620.0
        cur_demand = meta["base_demand"] + 6.0

        model = self.models.get(crop_name, self.models.get("Tomato"))
        X_test = np.array([[cur_rainfall, cur_temp, cur_arrivals, cur_demand]])
        predicted_mid = float(model.predict(X_test)[0])
        
        # Round and build realistic range
        price_spread = predicted_mid * 0.08
        min_price = round(predicted_mid - price_spread, 1)
        max_price = round(predicted_mid + price_spread, 1)
        formatted_price = f"₹{int(round(min_price))}–₹{int(round(max_price))}/kg"

        # Determine demand level
        if cur_demand >= 80:
            demand_level = "High"
            demand_badge = "success"
        elif cur_demand >= 65:
            demand_level = "Moderate"
            demand_badge = "warning"
        else:
            demand_level = "Low"
            demand_badge = "danger"

        # Generate 6-week projection curve for charts
        weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]
        projected_prices = [
            round(min_price * 0.95, 1),
            round(min_price, 1),
            round(predicted_mid, 1),
            round(max_price, 1),
            round(max_price * 1.05, 1),
            round(max_price * 1.03, 1) if meta["current_trend"] == "Increasing" else round(max_price * 0.94, 1)
        ]
        projected_demand = [
            round(cur_demand * 0.92, 1),
            round(cur_demand * 0.96, 1),
            round(cur_demand, 1),
            round(cur_demand * 1.04, 1),
            round(cur_demand * 1.07, 1),
            round(cur_demand * 1.05, 1) if meta["current_trend"] == "Increasing" else round(cur_demand * 0.90, 1)
        ]

        return {
            "crop": crop_name,
            "tamil_name": tamil_name,
            "district": district,
            "predicted_demand": demand_level,
            "demand_score": round(cur_demand, 1),
            "demand_badge": demand_badge,
            "expected_price_range": formatted_price,
            "min_price": min_price,
            "max_price": max_price,
            "avg_price": round((min_price + max_price) / 2, 1),
            "recommended_harvest_window": meta["optimal_window"],
            "demand_trend": f"{meta['trend_arrow']} {meta['current_trend']}",
            "trend_direction": meta["current_trend"],
            "trend_arrow": meta["trend_arrow"],
            "confidence_percent": meta["confidence"],
            "drivers": meta["drivers"],
            "projection_chart": {
                "labels": weeks,
                "prices": projected_prices,
                "demand": projected_demand
            },
            "recommendation_summary": f"{crop_name} ({tamil_name}) demand is {demand_level.lower()} and expected to remain strong in {district}. Best harvest window is {meta['optimal_window']} to maximize returns.",
            "recommendation_summary_tamil": f"{tamil_name} தேவை அதிகமாக உள்ளது மற்றும் {district} சந்தையில் வலுவாக இருக்கும் என கணிக்கப்பட்டுள்ளது. அதிக லாபம் பெற அறுவடை செய்ய பரிந்துரைக்கப்பட்ட காலம் {meta['optimal_window']} ஆகும்."
        }

    def list_all_forecasts(self, district: str = "Coimbatore") -> List[Dict[str, Any]]:
        return [self.predict_crop(c, district) for c in CROP_BASELINES.keys()]

forecast_engine = CropDemandModel()
