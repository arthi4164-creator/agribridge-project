from app.database import init_db
from app.seed_data import seed_database

if __name__ == "__main__":
    init_db()
    seed_database()
    print("ALL TABLES AND DEMO DATA SEEDED PERFECTLY!")
