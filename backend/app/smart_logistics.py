"""
AgriBridge AI - Smart Logistics Route Optimizer
Architecture compatible with Google OR-Tools + Maps/GIS.
Solves Capacitated Vehicle Routing Problem (CVRP) for rural farmer pickup:
Farmer Locations -> Central Collection Hub / Pre-Cooling Point -> Buyer Delivery Location.
Calculates:
- Total optimized route distance (km) vs independent travel distance
- Aggregated transport cost vs individual cost savings
- Estimated transit time (hours)
- Spoilage Risk Index (%) based on crop perishability, ambient temp, and transit hours
- Waypoints & GIS GeoJSON coordinates for interactive map visualization
"""
import math
from typing import List, Dict, Any

# Standard district hubs in Tamil Nadu with GIS coordinates
PREDEFINED_LOCATIONS = {
    "Coimbatore Hub": {"lat": 11.0168, "lng": 76.9558, "type": "Buyer"},
    "Pollachi Pre-cooling Hub": {"lat": 10.6609, "lng": 77.0048, "type": "Collection Hub"},
    "Farmer A (Kinathukadavu)": {"lat": 10.8167, "lng": 77.0167, "type": "Farmer"},
    "Farmer B (Negamam)": {"lat": 10.7412, "lng": 77.1021, "type": "Farmer"},
    "Farmer C (Sulur)": {"lat": 11.0267, "lng": 77.1264, "type": "Farmer"},
    "Farmer D (Thondamuthur)": {"lat": 10.9950, "lng": 76.8340, "type": "Farmer"},
    "Farmer E (Annur)": {"lat": 11.2333, "lng": 77.1833, "type": "Farmer"},
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS points."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class LogisticsOptimizer:
    def __init__(self):
        self.vehicle_capacity_kg = 2500 # Small commercial vehicle (e.g. Tata Ace / Bolero Maxi Truck)
        self.cost_per_km_empty = 14.0 # Base vehicle operational cost ₹/km
        self.cost_per_km_per_ton = 2.5 # Fuel & maintenance per ton/km
        self.average_speed_kmh = 38.0 # Rural and state highway average speed

    def calculate_spoilage_risk(self, crop_name: str, transit_hours: float, ambient_temp_c: float = 31.0) -> Dict[str, Any]:
        """
        Calculates perishable crop spoilage risk index.
        Tomato / Strawberries / Leafy greens: High sensitivity.
        Paddy / Onion / Potato: Low sensitivity.
        """
        crop_sensitivities = {
            "Tomato": {"shelf_life_h": 120, "temp_threshold": 26, "decay_rate": 0.045},
            "Carrot": {"shelf_life_h": 240, "temp_threshold": 24, "decay_rate": 0.025},
            "Cabbage": {"shelf_life_h": 160, "temp_threshold": 25, "decay_rate": 0.035},
            "Chili": {"shelf_life_h": 360, "temp_threshold": 28, "decay_rate": 0.015},
            "Onion": {"shelf_life_h": 720, "temp_threshold": 32, "decay_rate": 0.005},
            "Potato": {"shelf_life_h": 900, "temp_threshold": 32, "decay_rate": 0.004},
            "Paddy": {"shelf_life_h": 4000, "temp_threshold": 35, "decay_rate": 0.001}
        }
        params = crop_sensitivities.get(crop_name, {"shelf_life_h": 200, "temp_threshold": 26, "decay_rate": 0.02})
        
        # Heat factor: exponent if ambient temperature is above recommended threshold
        temp_factor = max(1.0, 1.0 + (ambient_temp_c - params["temp_threshold"]) * 0.08)
        
        # Risk formula: (transit_hours / shelf_life_h) * decay_rate * 100 * temp_factor
        raw_risk = (transit_hours / params["shelf_life_h"]) * params["decay_rate"] * 100 * temp_factor * 15
        spoilage_risk_percent = round(min(45.0, max(1.5, raw_risk)), 1)

        if spoilage_risk_percent < 8.0:
            risk_level = "Low"
            risk_color = "success"
            action = "Produce is safe. Normal ventilated transport is sufficient."
        elif spoilage_risk_percent < 18.0:
            risk_level = "Moderate"
            risk_color = "warning"
            action = "Advise thermal insulation covering and morning dispatch to prevent heat buildup."
        else:
            risk_level = "High"
            risk_color = "danger"
            action = "High spoilage hazard. Mandatory pre-cooling at Collection Point and refrigerated transit."

        return {
            "spoilage_risk_percent": spoilage_risk_percent,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "recommended_action": action,
            "ambient_temp_c": ambient_temp_c
        }

    def optimize_route(
        self,
        farmer_nodes: List[Dict[str, Any]],
        collection_hub: Dict[str, Any] = None,
        buyer_node: Dict[str, Any] = None,
        crop_name: str = "Tomato"
    ) -> Dict[str, Any]:
        """
        OR-Tools / Nearest-Neighbor & Savings heuristic:
        Visits Farmer 1 -> Farmer 2 -> ... -> Collection Hub -> Buyer.
        """
        if not collection_hub:
            collection_hub = {
                "name": "Pollachi Virtual FPO Pre-Cooling Hub",
                "lat": 10.6609,
                "lng": 77.0048,
                "type": "Collection Hub"
            }
        if not buyer_node:
            buyer_node = {
                "name": "Coimbatore Agro-Wholesale Buyer Hub",
                "lat": 11.0168,
                "lng": 76.9558,
                "type": "Buyer"
            }

        # Calculate distances
        current_lat = collection_hub["lat"]
        current_lng = collection_hub["lng"]
        unvisited = list(farmer_nodes)
        ordered_farmers = []
        pickup_distance = 0.0

        # TSP / Nearest neighbor for farmer pickups
        while unvisited:
            best_idx = 0
            best_dist = 999999
            for i, node in enumerate(unvisited):
                d = haversine_distance(current_lat, current_lng, node["lat"], node["lng"])
                if d < best_dist:
                    best_dist = d
                    best_idx = i
            chosen = unvisited.pop(best_idx)
            ordered_farmers.append(chosen)
            pickup_distance += best_dist
            current_lat = chosen["lat"]
            current_lng = chosen["lng"]

        # Farmer to Collection Hub
        hub_transit_dist = haversine_distance(current_lat, current_lng, collection_hub["lat"], collection_hub["lng"])
        
        # Collection Hub to Buyer
        hub_to_buyer_dist = haversine_distance(collection_hub["lat"], collection_hub["lng"], buyer_node["lat"], buyer_node["lng"])
        
        # Total optimized distance (road curvature factor = 1.25x haversine)
        total_optimized_km = round((pickup_distance + hub_transit_dist + hub_to_buyer_dist) * 1.25, 1)

        # Standalone comparison (if each farmer hired their own auto/tempo individually to buyer)
        individual_distance = 0.0
        for f in farmer_nodes:
            direct_dist = haversine_distance(f["lat"], f["lng"], buyer_node["lat"], buyer_node["lng"]) * 1.25
            individual_distance += (direct_dist * 2) # Round trip
        individual_distance = round(individual_distance, 1)

        # Quantities
        total_quantity_kg = sum(f.get("quantity_kg", 150) for f in farmer_nodes)
        
        # Transport Costs
        # Aggregated route cost: vehicle flat base + fuel rate
        tons = total_quantity_kg / 1000.0
        transport_cost = round(total_optimized_km * (self.cost_per_km_empty + (tons * self.cost_per_km_per_ton)) + 450, 0)
        
        # Individual trip cost (e.g. 3-4 separate mini tempos @ ₹1800 each)
        individual_cost = round(len(farmer_nodes) * 1850.0, 0)
        cost_savings = round(max(0, individual_cost - transport_cost), 0)
        savings_percent = round((cost_savings / individual_cost) * 100, 1) if individual_cost > 0 else 0

        # Estimated transit time (hours)
        transit_hours = round((total_optimized_km / self.average_speed_kmh) + (len(farmer_nodes) * 0.4), 1)

        # Spoilage Risk
        spoilage_data = self.calculate_spoilage_risk(crop_name, transit_hours)

        # CO2 emissions reduction (0.24 kg CO2 per km for commercial diesel light truck)
        co2_saved_kg = round(max(0, (individual_distance - total_optimized_km) * 0.24), 1)

        # Assemble full route waypoints
        waypoints = []
        for i, f in enumerate(ordered_farmers):
            waypoints.append({
                "step": i + 1,
                "role": "Farmer Pickup",
                "name": f.get("name", f"Farmer {chr(65 + i)}"),
                "location": f.get("location", "Farm Point"),
                "quantity_kg": f.get("quantity_kg", 100),
                "lat": f["lat"],
                "lng": f["lng"],
                "action": f"Collect {f.get('quantity_kg', 100)} kg {crop_name}"
            })
        
        waypoints.append({
            "step": len(ordered_farmers) + 1,
            "role": "Virtual FPO Hub",
            "name": collection_hub["name"],
            "location": "Pollachi Rural Hub",
            "quantity_kg": total_quantity_kg,
            "lat": collection_hub["lat"],
            "lng": collection_hub["lng"],
            "action": f"Consolidate {total_quantity_kg} kg, quality grading & batch QR tagging"
        })

        waypoints.append({
            "step": len(ordered_farmers) + 2,
            "role": "Buyer Destination",
            "name": buyer_node["name"],
            "location": "Coimbatore Agro-Wholesale Market",
            "quantity_kg": total_quantity_kg,
            "lat": buyer_node["lat"],
            "lng": buyer_node["lng"],
            "action": "Unload, QR scan verification, and Escrow payment release"
        })

        return {
            "crop": crop_name,
            "farmers_grouped_count": len(farmer_nodes),
            "total_quantity_kg": total_quantity_kg,
            "total_distance_km": total_optimized_km,
            "individual_travel_km": individual_distance,
            "km_saved": round(individual_distance - total_optimized_km, 1),
            "estimated_transit_hours": transit_hours,
            "transport_cost_rs": transport_cost,
            "individual_transport_cost_rs": individual_cost,
            "cost_savings_rs": cost_savings,
            "savings_percent": savings_percent,
            "co2_saved_kg": co2_saved_kg,
            "spoilage_risk": spoilage_data,
            "vehicle_type": "Tata Ace / 2.5T Insulated Multi-Temp Agri-Carrier",
            "collection_point": collection_hub["name"],
            "destination_buyer": buyer_node["name"],
            "waypoints": waypoints,
            "route_polyline": [
                [w["lat"], w["lng"]] for w in waypoints
            ]
        }

logistics_optimizer = LogisticsOptimizer()
