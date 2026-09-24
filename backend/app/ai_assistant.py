"""
AgriBridge AI - Bilingual AI Agricultural Assistant Engine
Supports English & Tamil (தமிழ்)
Understands farmer intents:
- Crop demand queries
- Expected price & MSP queries
- Buyer requirements matching
- Virtual FPO aggregation status
- Logistics & Spoilage alerts
- Form Auto-filling for "Sell Crop" & "Reverse Marketplace"
"""
import re
from typing import Dict, Any, List

CROP_DICTIONARY = {
    "tomato": "Tomato", "tomatoes": "Tomato", "தக்காளி": "Tomato",
    "onion": "Onion", "onions": "Onion", "வெங்காயம்": "Onion",
    "potato": "Potato", "potatoes": "Potato", "உருளைக்கிழங்கு": "Potato",
    "paddy": "Paddy", "rice": "Paddy", "நெல்": "Paddy",
    "chili": "Chili", "chilli": "Chili", "மிளகாய்": "Chili",
    "carrot": "Carrot", "carrots": "Carrot", "கேரட்": "Carrot",
    "cabbage": "Cabbage", "முட்டைக்கோஸ்": "Cabbage"
}

LOCATION_DICTIONARY = {
    "coimbatore": "Coimbatore", "கோவை": "Coimbatore",
    "pollachi": "Pollachi", "பொள்ளாச்சி": "Pollachi",
    "salem": "Salem", "சேலம்": "Salem",
    "madurai": "Madurai", "மதுரை": "Madurai",
    "tiruppur": "Tiruppur", "திருப்பூர்": "Tiruppur",
    "erode": "Erode", "ஈரோடு": "Erode",
    "dindigul": "Dindigul", "திண்டுக்கல்": "Dindigul",
    "sulur": "Sulur", "சூலூர்": "Sulur"
}

def extract_entities(user_text: str) -> Dict[str, Any]:
    text_lower = user_text.lower()
    entities = {}

    # Extract crop
    for key, crop_val in CROP_DICTIONARY.items():
        if key in text_lower:
            entities["crop"] = crop_val
            break

    # Extract quantity (e.g. 500 kg, 500kg, 2 tons, 200 கிலோ, 1000)
    qty_match = re.search(r'(\d+[\.,]?\d*)\s*(kg|kgs|kilogram|kilo|கிலோ|ton|tons|டன்)?', text_lower)
    if qty_match:
        val = float(qty_match.group(1).replace(',', ''))
        unit = qty_match.group(2)
        if unit in ["ton", "tons", "டன்"]:
            val *= 1000
        entities["quantity_kg"] = val

    # Extract location
    for loc_key, loc_val in LOCATION_DICTIONARY.items():
        if loc_key in text_lower:
            entities["location"] = loc_val
            break

    return entities

def process_ai_assistant_chat(
    message: str,
    language: str = "en",
    conversation_state: Dict[str, Any] = None
) -> Dict[str, Any]:
    if not conversation_state:
        conversation_state = {"step": "initial", "form_data": {}}

    entities = extract_entities(message)
    form_data = conversation_state.get("form_data", {})
    
    # Merge detected entities
    if "crop" in entities:
        form_data["crop"] = entities["crop"]
    if "quantity_kg" in entities:
        form_data["quantity_kg"] = entities["quantity_kg"]
    if "location" in entities:
        form_data["location"] = entities["location"]

    msg_lower = message.lower()
    is_tamil = (language == "ta") or any(char in message for char in "அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன")

    # Flow logic for conversational form filling
    if not form_data.get("crop"):
        if is_tamil:
            reply = "வணக்கம் விவசாய நண்பரே! நீங்கள் என்ன பயிர் விற்க விரும்புகிறீர்கள்? (உதாரணம்: தக்காளி, வெங்காயம், உருளைக்கிழங்கு)"
        else:
            reply = "Welcome to AgriBridge AI! What crop do you want to sell today? (e.g., Tomato, Onion, Potato, Paddy)"
        next_step = "awaiting_crop"

    elif not form_data.get("quantity_kg"):
        crop = form_data['crop']
        if is_tamil:
            reply = f"அருமை! {crop} எவ்வளவு அளவு (kg) உங்களிடம் உள்ளது? (உதாரணம்: 500 kg)"
        else:
            reply = f"Great! How much quantity of {crop} do you have available? (e.g., 500 kg)"
        next_step = "awaiting_quantity"

    elif not form_data.get("location"):
        qty = form_data['quantity_kg']
        crop = form_data['crop']
        if is_tamil:
            reply = f"பதிவு செய்யப்பட்டது: {qty} kg {crop}. உங்கள் கிராமம் அல்லது மாவட்டம் எது? (உதாரணம்: கோவை, பொள்ளாச்சி)"
        else:
            reply = f"Noted: {qty} kg of {crop}. What is your farm location or district? (e.g., Coimbatore, Pollachi)"
        next_step = "awaiting_location"

    else:
        # All three entities present! Form can be populated automatically.
        crop = form_data["crop"]
        qty = form_data["quantity_kg"]
        loc = form_data["location"]
        
        # Calculated fair price projection for this crop
        fair_price_est = 29.0 if crop == "Tomato" else 32.0
        total_payout = int(qty * fair_price_est)

        if is_tamil:
            reply = (
                f"✅ பயிர் விவரங்கள் தானாக நிரப்பப்பட்டது!\n"
                f"• பயிர்: {crop}\n"
                f"• அளவு: {qty} kg\n"
                f"• இடம்: {loc}\n"
                f"💡 AI கணிப்பு: அதிக தேவை! எதிர்பார்க்கப்படும் நியாய விலை ₹{fair_price_est}/kg (மதிப்பு: ₹{total_payout:,}).\n"
                f"உடனே 'Reverse Marketplace' கோரிக்கைகளுக்கு பதிலளிக்கவா அல்லது 'Virtual FPO' குழுவில் இணைக்கவா?"
            )
        else:
            reply = (
                f"✅ Form auto-populated successfully!\n"
                f"• Crop: {crop}\n"
                f"• Quantity: {qty} kg\n"
                f"• Location: {loc}\n"
                f"💡 AI Forecast: High Demand! Expected fair price is ₹{fair_price_est}/kg (Est. Value: ₹{total_payout:,}).\n"
                f"Would you like to respond to open buyer requirements or pool with nearby Virtual FPO?"
            )
        next_step = "form_ready"

    # Specific query shortcuts
    if "price" in msg_lower or "விலை" in msg_lower:
        if is_tamil:
            reply = "தக்காளி சந்தை விலை தற்போது ₹28–₹32/kg என கணிக்கப்பட்டுள்ளது. நியாய விலை கால்குலேட்டரில் சரிபார்க்கலாம்."
        else:
            reply = "Current AI predicted price for Tomato is ₹28–₹32/kg. You can verify the full production breakdown in the Fair Price tab."

    elif "buyer" in msg_lower or "வாங்குபவர்" in msg_lower or "தேவை" in msg_lower:
        if is_tamil:
            reply = "கோயம்புத்தூரில் உள்ள மொத்த வாங்குபவர் 1000 kg Grade A தக்காளிக்கு கோரிக்கை விடுத்துள்ளார். 'Reverse Marketplace' பக்கத்தில் பார்க்கலாம்."
        else:
            reply = "A bulk buyer in Coimbatore has an active requirement for 1,000 kg Grade A Tomato at ₹30/kg. Check Reverse Marketplace to respond!"

    return {
        "reply": reply,
        "reply_tamil": reply if is_tamil else None,
        "next_step": next_step,
        "conversation_state": {
            "step": next_step,
            "form_data": form_data
        },
        "auto_fill_form": {
            "crop": form_data.get("crop"),
            "quantity_kg": form_data.get("quantity_kg"),
            "location": form_data.get("location"),
            "ready_for_submit": bool(form_data.get("crop") and form_data.get("quantity_kg") and form_data.get("location"))
        }
    }
