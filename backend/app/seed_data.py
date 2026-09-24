"""
AgriBridge AI - Realistic SIH26033 Demo Data Seeder
Populates users, crops, produce listings, buyer requirements, virtual FPO groups, logistics routes, QR batches, payments, and notifications.
"""
import json
from datetime import datetime, date, timedelta
from .database import get_db_connection
from .auth import hash_password
from .qr_service import generate_batch_qr

def seed_database():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing demo data
    cursor.execute("DELETE FROM notifications")
    cursor.execute("DELETE FROM payments")
    cursor.execute("DELETE FROM qr_batches")
    cursor.execute("DELETE FROM logistics_routes")
    cursor.execute("DELETE FROM requirement_responses")
    cursor.execute("DELETE FROM virtual_fpo_items")
    cursor.execute("DELETE FROM virtual_fpo_groups")
    cursor.execute("DELETE FROM buyer_requirements")
    cursor.execute("DELETE FROM farmer_produce")
    cursor.execute("DELETE FROM crops")
    cursor.execute("DELETE FROM farmers")
    cursor.execute("DELETE FROM users")

    # 1. Users (Farmer, FPO, Buyer, Admin)
    users_data = [
        # Farmers
        ("Muthuvel Farmer A", "farmer_a@agribridge.in", "9842100001", "farmer", hash_password("pass123"), "Kinathukadavu", "Coimbatore", 10.8167, 77.0167),
        ("Ramasamy Farmer B", "farmer_b@agribridge.in", "9842100002", "farmer", hash_password("pass123"), "Negamam", "Coimbatore", 10.7412, 77.1021),
        ("Palanisamy Farmer C", "farmer_c@agribridge.in", "9842100003", "farmer", hash_password("pass123"), "Sulur", "Coimbatore", 11.0267, 77.1264),
        ("Selvi Farmer D", "farmer_d@agribridge.in", "9842100004", "farmer", hash_password("pass123"), "Thondamuthur", "Coimbatore", 10.9950, 76.8340),
        # FPO Lead
        ("Kongu Virtual FPO Co-op", "fpo@agribridge.in", "9842100010", "fpo", hash_password("pass123"), "Pollachi Hub", "Coimbatore", 10.6609, 77.0048),
        # Bulk Buyers
        ("Coimbatore Agro Fresh Wholesale", "buyer@agribridge.in", "9842100020", "buyer", hash_password("pass123"), "R.S. Puram", "Coimbatore", 11.0168, 76.9558),
        ("Metro City Hypermarkets", "metro@agribridge.in", "9842100021", "buyer", hash_password("pass123"), "Saibaba Colony", "Coimbatore", 11.0315, 76.9452),
        # Admin
        ("AgriBridge System Admin", "admin@agribridge.in", "9842100099", "admin", hash_password("pass123"), "District Collectorate", "Coimbatore", 11.0016, 76.9629),
    ]

    user_ids = {}
    for name, email, phone, role, p_hash, loc, dist, lat, lng in users_data:
        cursor.execute("""
            INSERT INTO users (name, email, phone, role, password_hash, location, district, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, email, phone, role, p_hash, loc, dist, lat, lng))
        user_ids[email] = cursor.lastrowid

    # 2. Farmers Table records
    cursor.execute("INSERT INTO farmers (user_id, farm_size_acres, bank_account, ifsc_code) VALUES (?, ?, ?, ?)",
                   (user_ids["farmer_a@agribridge.in"], 3.5, "SBI-984210111", "SBIN0002194"))
    cursor.execute("INSERT INTO farmers (user_id, farm_size_acres, bank_account, ifsc_code) VALUES (?, ?, ?, ?)",
                   (user_ids["farmer_b@agribridge.in"], 2.0, "IOB-441200112", "IOBA0001102"))
    cursor.execute("INSERT INTO farmers (user_id, farm_size_acres, bank_account, ifsc_code) VALUES (?, ?, ?, ?)",
                   (user_ids["farmer_c@agribridge.in"], 4.2, "Canara-5501928", "CNRB0002931"))
    cursor.execute("INSERT INTO farmers (user_id, farm_size_acres, bank_account, ifsc_code) VALUES (?, ?, ?, ?)",
                   (user_ids["farmer_d@agribridge.in"], 1.8, "KVB-33019284", "KVBL0001402"))

    # 3. Crops Catalog
    crops_data = [
        ("Tomato", "தக்காளி", "Vegetable", 18.0, 10, "High", 20.0, "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400"),
        ("Onion", "வெங்காயம்", "Vegetable", 22.0, 45, "Medium", 25.0, "https://images.unsplash.com/photo-1508747703725-719777637510?w=400"),
        ("Potato", "உருளைக்கிழங்கு", "Vegetable", 16.0, 60, "Low", 18.0, "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400"),
        ("Paddy", "நெல்", "Grain", 21.0, 180, "Low", 23.0, "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"),
        ("Chili", "மிளகாய்", "Spice", 95.0, 90, "Medium", 110.0, "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400"),
        ("Carrot", "கேரட்", "Vegetable", 24.0, 21, "High", 28.0, "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400"),
        ("Cabbage", "முட்டைக்கோஸ்", "Vegetable", 12.0, 14, "High", 14.0, "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400"),
    ]
    for c_name, t_name, cat, b_cost, s_life, per, msp, img in crops_data:
        cursor.execute("""
            INSERT INTO crops (name, tamil_name, category, base_production_cost, shelf_life_days, perishability, msp_benchmark, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (c_name, t_name, cat, b_cost, s_life, per, msp, img))

    # 4. Farmer Produce Listings
    harvest_today = date.today().isoformat()
    harvest_in_3 = (date.today() + timedelta(days=3)).isoformat()
    harvest_in_7 = (date.today() + timedelta(days=7)).isoformat()

    produce_data = [
        (user_ids["farmer_a@agribridge.in"], "Muthuvel Farmer A", "Tomato", 100.0, 0.0, "Grade A", 28.0, "Kinathukadavu", harvest_in_3, "Aggregated", 10.8167, 77.0167),
        (user_ids["farmer_b@agribridge.in"], "Ramasamy Farmer B", "Tomato", 150.0, 0.0, "Grade A", 28.5, "Negamam", harvest_in_3, "Aggregated", 10.7412, 77.1021),
        (user_ids["farmer_c@agribridge.in"], "Palanisamy Farmer C", "Tomato", 250.0, 0.0, "Grade A", 29.0, "Sulur", harvest_in_3, "Aggregated", 11.0267, 77.1264),
        (user_ids["farmer_d@agribridge.in"], "Selvi Farmer D", "Tomato", 200.0, 200.0, "Grade A", 29.5, "Thondamuthur", harvest_in_7, "Available", 10.9950, 76.8340),
        (user_ids["farmer_a@agribridge.in"], "Muthuvel Farmer A", "Onion", 300.0, 300.0, "Grade A", 34.0, "Kinathukadavu", harvest_in_7, "Available", 10.8167, 77.0167),
        (user_ids["farmer_b@agribridge.in"], "Ramasamy Farmer B", "Potato", 450.0, 450.0, "Grade B", 22.0, "Negamam", harvest_in_7, "Available", 10.7412, 77.1021),
    ]
    produce_ids = []
    for f_id, f_name, c_name, qty, avail, qual, exp_p, loc, h_date, stat, lat, lng in produce_data:
        cursor.execute("""
            INSERT INTO farmer_produce (farmer_id, farmer_name, crop_name, quantity_kg, available_quantity_kg, quality_grade, expected_price_per_kg, location, harvest_date, status, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (f_id, f_name, c_name, qty, avail, qual, exp_p, loc, h_date, stat, lat, lng))
        produce_ids.append(cursor.lastrowid)

    # 5. Buyer Requirements (Reverse Marketplace)
    req_date = (date.today() + timedelta(days=6)).isoformat()
    req_date_2 = (date.today() + timedelta(days=10)).isoformat()

    buyer_reqs = [
        (user_ids["buyer@agribridge.in"], "Coimbatore Agro Fresh Wholesale", "AgroFresh Corp", "Tomato", 1000.0, 500.0, "Grade A", 30.0, "Coimbatore Agro-Wholesale Market", "Coimbatore", req_date, 11.0168, 76.9558, "Partially Fulfilled"),
        (user_ids["metro@agribridge.in"], "Metro City Hypermarkets", "Metro Supermarkets Ltd", "Onion", 1500.0, 0.0, "Grade A", 36.0, "Metro Distribution Center, Singanallur", "Coimbatore", req_date_2, 11.0020, 77.0250, "Open"),
        (user_ids["buyer@agribridge.in"], "Coimbatore Agro Fresh Wholesale", "AgroFresh Corp", "Potato", 2000.0, 0.0, "Grade A", 24.0, "Coimbatore Agro-Wholesale Market", "Coimbatore", req_date_2, 11.0168, 76.9558, "Open"),
    ]
    buyer_req_ids = []
    for b_id, b_name, b_comp, c_name, req_qty, ful_qty, q_grade, max_p, del_loc, del_dist, r_date, lat, lng, stat in buyer_reqs:
        cursor.execute("""
            INSERT INTO buyer_requirements (buyer_id, buyer_name, buyer_company, crop_name, required_quantity_kg, fulfilled_quantity_kg, quality_grade, max_price_per_kg, delivery_location, delivery_district, required_date, latitude, longitude, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (b_id, b_name, b_comp, c_name, req_qty, ful_qty, q_grade, max_p, del_loc, del_dist, r_date, lat, lng, stat))
        buyer_req_ids.append(cursor.lastrowid)

    # 6. Virtual FPO Groups (Demonstrating 100kg + 150kg + 250kg = 500kg Bulk Order)
    cursor.execute("""
        INSERT INTO virtual_fpo_groups (
            group_code, crop_name, quality_grade, target_quantity_kg, current_quantity_kg,
            fpo_lead_name, buyer_requirement_id, buyer_name, delivery_location, status,
            collection_center, collection_lat, collection_lng
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "VFPO-2026-TOM-500", "Tomato", "Grade A", 500.0, 500.0,
        "Kongu Virtual FPO Co-op", buyer_req_ids[0], "Coimbatore Agro Fresh Wholesale",
        "Coimbatore Agro-Wholesale Market", "Dispatched",
        "Pollachi Pre-cooling Hub", 10.6609, 77.0048
    ))
    vfpo_group_id = cursor.lastrowid

    # 7. Virtual FPO Items (Farmer contributions)
    v_items = [
        (vfpo_group_id, user_ids["farmer_a@agribridge.in"], "Muthuvel Farmer A", produce_ids[0], "Tomato", 100.0, "Grade A", 29.0, "Kinathukadavu", harvest_in_3, 2900.0, "Escrow Locked"),
        (vfpo_group_id, user_ids["farmer_b@agribridge.in"], "Ramasamy Farmer B", produce_ids[1], "Tomato", 150.0, "Grade A", 29.0, "Negamam", harvest_in_3, 4350.0, "Escrow Locked"),
        (vfpo_group_id, user_ids["farmer_c@agribridge.in"], "Palanisamy Farmer C", produce_ids[2], "Tomato", 250.0, "Grade A", 29.0, "Sulur", harvest_in_3, 7250.0, "Escrow Locked"),
    ]
    for g_id, fa_id, fa_name, prod_id, cr_name, q_kg, q_grade, pr_kg, fa_loc, h_dt, pay_amt, pay_st in v_items:
        cursor.execute("""
            INSERT INTO virtual_fpo_items (group_id, farmer_id, farmer_name, produce_id, crop_name, quantity_kg, quality_grade, price_per_kg, farmer_location, harvest_date, payout_amount, payout_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (g_id, fa_id, fa_name, prod_id, cr_name, q_kg, q_grade, pr_kg, fa_loc, h_dt, pay_amt, pay_st))

    # 8. Smart Logistics Route
    cursor.execute("""
        INSERT INTO logistics_routes (
            group_id, crop_name, total_quantity_kg, origin_hubs, collection_point,
            destination_buyer, total_distance_km, transport_cost_rs, individual_transport_cost_rs,
            cost_savings_rs, estimated_hours, farmers_grouped_count, spoilage_risk_percent,
            spoilage_risk_level, vehicle_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        vfpo_group_id, "Tomato", 500.0,
        json.dumps(["Kinathukadavu (100kg)", "Negamam (150kg)", "Sulur (250kg)"]),
        "Pollachi Pre-cooling Hub", "Coimbatore Agro-Wholesale Market",
        58.4, 1420.0, 5550.0, 4130.0, 2.4, 3, 5.2, "Low",
        "Tata Ace Insulated Rural Carrier", "In Transit"
    ))

    # 9. QR Batch
    qr_res = generate_batch_qr(
        batch_id="BATCH-TN-2026-TOM-001",
        fpo_name="Kongu Virtual FPO Co-op",
        farmer_names=["Muthuvel Farmer A (100kg)", "Ramasamy Farmer B (150kg)", "Palanisamy Farmer C (250kg)"],
        crop="Tomato",
        quantity_kg=500.0,
        quality_grade="Grade A",
        origin_district="Coimbatore",
        harvest_date=harvest_in_3,
        buyer_name="Coimbatore Agro Fresh Wholesale",
        delivery_location="Coimbatore Agro-Wholesale Market",
        fair_price_per_kg=29.0
    )

    cursor.execute("""
        INSERT INTO qr_batches (
            batch_id, group_id, crop_name, total_quantity_kg, quality_grade, farmer_names,
            origin_district, harvest_date, buyer_name, delivery_location, qr_code_base64,
            verification_status, verified_at, verified_by, inspection_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "BATCH-TN-2026-TOM-001", vfpo_group_id, "Tomato", 500.0, "Grade A",
        "Muthuvel (100kg), Ramasamy (150kg), Palanisamy (250kg)",
        "Coimbatore", harvest_in_3, "Coimbatore Agro Fresh Wholesale",
        "Coimbatore Agro-Wholesale Market", qr_res["qr_base64"],
        "Pending Verification", None, None, "Pre-dispatch quality audit passed. 500 kg Grade A ripe firm tomatoes."
    ))

    # 10. Payment Escrow Record
    farmer_splits = [
        {"farmer_name": "Muthuvel Farmer A", "quantity_kg": 100, "share_percent": 20.0, "payout_amount": 2900.0, "bank": "SBI-***111", "status": "Escrow Secured"},
        {"farmer_name": "Ramasamy Farmer B", "quantity_kg": 150, "share_percent": 30.0, "payout_amount": 4350.0, "bank": "IOB-***112", "status": "Escrow Secured"},
        {"farmer_name": "Palanisamy Farmer C", "quantity_kg": 250, "share_percent": 50.0, "payout_amount": 7250.0, "bank": "Canara-***928", "status": "Escrow Secured"},
    ]

    cursor.execute("""
        INSERT INTO payments (
            payment_ref, batch_id, group_id, buyer_id, buyer_name, total_amount,
            stage, status, farmer_splits_json, escrow_account, transaction_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "PAY-AGRI-2026-0089", "BATCH-TN-2026-TOM-001", vfpo_group_id,
        user_ids["buyer@agribridge.in"], "Coimbatore Agro Fresh Wholesale", 14500.0,
        3, "Produce Dispatched", json.dumps(farmer_splits),
        "SBI-ESCROW-AGRI-99218", "TXN-8829410A"
    ))

    # 11. Realistic Notifications
    notifications_data = [
        (user_ids["farmer_a@agribridge.in"], "farmer", "Virtual FPO Pool Formed!", "விர்ச்சுவல் FPO குழு உருவானது!", "Your 100 kg Tomato joined 400 kg from 2 neighboring farmers. Bulk Order total: 500 kg at ₹29/kg.", "உங்கள் 100 கிலோ தக்காளி பிற விவசாயிகளுடன் இணைந்து 500 கிலோ மொத்த ஆர்டராக மாறியது. விலை: ₹29/கிலோ.", "success"),
        (user_ids["farmer_b@agribridge.in"], "farmer", "Escrow Payment Locked", "பணம் எஸ்க்ரோவில் பாதுகாக்கப்பட்டது", "Buyer deposited ₹14,500 into Escrow. Your share of ₹4,350 is 100% guaranteed upon QR scan.", "வாங்குபவர் ₹14,500 எஸ்க்ரோவில் செலுத்தினார். உங்கள் பங்கு ₹4,350 பாதுகாப்பானது.", "info"),
        (user_ids["buyer@agribridge.in"], "buyer", "Bulk Consignment Dispatched", "மொத்த சரக்கு அனுப்பப்பட்டது", "Kongu Virtual FPO dispatched 500 kg Grade A Tomato. Driver transit time: 2.4 hrs.", "500 கிலோ தக்காளி அனுப்பப்பட்டது. வந்து சேரும் நேரம்: 2.4 மணிநேரம்.", "order"),
        (None, "all", "Tomato Demand High in Coimbatore", "கோவையில் தக்காளிக்கு அதிக தேவை", "AI forecasts 18% higher demand for next 10 days. Suggested fair price: ₹28–₹32/kg.", "அடுத்த 10 நாட்களுக்கு தக்காளி தேவை 18% அதிகரிக்கும் என AI கணிக்கிறது.", "warning")
    ]
    for u_id, rl, title, title_ta, msg, msg_ta, n_type in notifications_data:
        cursor.execute("""
            INSERT INTO notifications (user_id, role, title, title_tamil, message, message_tamil, type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (u_id, rl, title, title_ta, msg, msg_ta, n_type))

    conn.commit()
    conn.close()
    print("Demo data seeded successfully.")

if __name__ == "__main__":
    seed_database()
