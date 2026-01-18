"""
Scaler Compatibility Fix
========================

ISSUE: If your scaler.pkl was trained on 3 features (valve, pressure, flow)
but we're now using 4 features (valve, pressure, flow, temperature),
you'll get a shape mismatch error.

SOLUTION OPTIONS:

Option 1: Retrain Model (Recommended)
--------------------------------------
1. Open train_model.ipynb
2. Run all cells
3. This creates new scaler.pkl with correct shape
4. Done!

Option 2: Create Dummy Scaler (Quick Fix)
-----------------------------------------
If you don't have time to retrain, use this temporary scaler.
"""

import pickle
import numpy as np
from sklearn.preprocessing import StandardScaler

def create_dummy_scaler():
    """
    Creates a minimal scaler that matches the expected 4-feature format
    
    WARNING: This is for DEMO purposes only!
    - Predictions will be less accurate
    - Use only if you can't retrain the model
    """
    
    print("Creating dummy scaler for 4 features...")
    
    # Create dummy data matching expected format
    # [valve, pressure, flow, temperature]
    dummy_data = np.array([
        [0, 0, 0, 500],      # Min values (approximate)
        [100, 10, 200, 600]  # Max values (approximate)
    ])
    
    scaler = StandardScaler()
    scaler.fit(dummy_data)
    
    # Save it
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    
    print("✅ Created scaler.pkl")
    print(f"   Features: {scaler.n_features_in_}")
    print(f"   Mean: {scaler.mean_}")
    print(f"   Std: {scaler.scale_}")
    print("\n⚠️  WARNING: This is a dummy scaler!")
    print("   For production, retrain using train_model.ipynb")
    
    return scaler

def check_scaler():
    """
    Check if existing scaler has correct shape
    """
    try:
        with open('scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        
        features = scaler.n_features_in_
        print(f"Current scaler: {features} features")
        
        if features == 4:
            print("✅ Scaler is correct!")
            return True
        else:
            print(f"❌ Scaler has {features} features, need 4")
            print("   Run create_dummy_scaler() or retrain model")
            return False
            
    except FileNotFoundError:
        print("❌ scaler.pkl not found")
        print("   Run create_dummy_scaler() or train_model.ipynb")
        return False

if __name__ == "__main__":
    print("="*60)
    print("SCALER COMPATIBILITY CHECK")
    print("="*60)
    
    is_ok = check_scaler()
    
    if not is_ok:
        print("\nDo you want to create a dummy scaler? (y/n)")
        choice = input("> ").strip().lower()
        
        if choice == 'y':
            create_dummy_scaler()
            print("\n✅ You can now start the server!")
            print("   python main.py")
        else:
            print("\nPlease run train_model.ipynb to create proper scaler")
    else:
        print("\n✅ Everything is ready!")
        print("   python main.py")
