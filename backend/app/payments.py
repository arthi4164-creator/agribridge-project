"""
AgriBridge AI - Secure Escrow Payment Engine
5-Stage Transparent Agricultural Escrow Workflow:
1. Buyer Places Order
2. Payment Initiated & Escrow Locked
3. Produce Supplied (In Transit with Smart Logistics)
4. Produce Verified (Buyer scans QR code & accepts quality)
5. Payment Released (Escrow released to farmers' individual bank accounts)
"""
from datetime import datetime
import hashlib
from typing import Dict, Any, List

PAYMENT_STAGES = [
    {"stage": 1, "code": "ORDER_PLACED", "label": "Order Placed", "label_tamil": "ஆர்டர் செய்யப்பட்டது", "desc": "Buyer committed order quantity and agreed on fair price."},
    {"stage": 2, "code": "ESCROW_LOCKED", "label": "Escrow Locked", "label_tamil": "தொகை பாதுகாப்பானது (Escrow)", "desc": "Buyer funds deposited in neutral Escrow sandbox account."},
    {"stage": 3, "code": "PRODUCE_SUPPLIED", "label": "Produce Dispatched", "label_tamil": "பொருட்கள் அனுப்பப்பட்டது", "desc": "Aggregated bulk batch collected and in transit via Smart Logistics."},
    {"stage": 4, "code": "VERIFICATION_PENDING", "label": "Produce Verified", "label_tamil": "பொருட்கள் சரிபார்க்கப்பட்டது", "desc": "Buyer scanned batch QR code, confirmed Grade A/B condition."},
    {"stage": 5, "code": "PAYMENT_RELEASED", "label": "Payment Released", "label_tamil": "பணம் விடுவிக்கப்பட்டது", "desc": "Escrow automatically distributed to individual farmer bank accounts."}
]

def calculate_farmer_splits(
    total_order_amount: float,
    farmer_contributions: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Calculates each farmer's exact financial share based on contributed kg and fair price."""
    total_kg = sum(f["quantity_kg"] for f in farmer_contributions)
    if total_kg == 0:
        return []

    splits = []
    for f in farmer_contributions:
        share_ratio = f["quantity_kg"] / total_kg
        allocated_amount = round(share_ratio * total_order_amount, 2)
        splits.append({
            "farmer_id": f.get("farmer_id"),
            "farmer_name": f.get("farmer_name", "Farmer"),
            "quantity_kg": f.get("quantity_kg"),
            "quality_grade": f.get("quality_grade", "Grade A"),
            "share_percent": round(share_ratio * 100, 1),
            "payout_amount": allocated_amount,
            "bank_account_masked": f.get("bank_account_masked", "XXXX-XXXX-7142"),
            "ifsc": f.get("ifsc", "SBIN0001234"),
            "transfer_status": "Scheduled for Release"
        })
    return splits

def advance_escrow_stage(current_stage: int) -> Dict[str, Any]:
    next_stage = min(5, current_stage + 1)
    stage_info = PAYMENT_STAGES[next_stage - 1]
    
    # Generate mock transaction reference
    tx_hash = "TXN-" + hashlib.sha256(f"stage_{next_stage}_{datetime.utcnow()}".encode()).hexdigest()[:12].upper()
    
    return {
        "stage": next_stage,
        "status_code": stage_info["code"],
        "status_label": stage_info["label"],
        "status_label_tamil": stage_info["label_tamil"],
        "description": stage_info["desc"],
        "transaction_ref": tx_hash,
        "updated_at": datetime.utcnow().isoformat(),
        "is_completed": (next_stage == 5)
    }
