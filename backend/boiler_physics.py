"""
Drum Boiler Physics Engine
===========================
Simulates the mass and energy balance of an industrial drum boiler.

PHYSICS MODEL:
- Fire generates steam (boils water)
- Constant feedwater inflow maintains level
- Pressure builds from steam generation
- Safety limits trigger alarms

Key Variables:
- water_level: 0-100% (drum fill level)
- pressure: 0-25 MPa (steam pressure)
- fire_intensity: 0-100% (coal firing rate)
"""

import time
from typing import Dict, Optional


class DrumBoilerPhysics:
    """
    Drum Boiler Simulation Engine
    
    CORE PHYSICS:
    1. Mass Balance: water_level = inflow - evaporation
    2. Energy Balance: pressure = heat_input - steam_extraction
    3. Thermal Inertia: Changes happen gradually (lag effects)
    """
    
    # ========================
    # Physical Constants
    # ========================
    
    # Mass balance constants
    FEEDWATER_INFLOW = 15.0  # Constant pump rate (units/sec)
    STEAM_CONVERSION_FACTOR = 0.5  # Fire -> Steam efficiency
    
    # Energy balance constants
    PRESSURE_BUILD_RATE = 1.0  # How fast pressure rises
    PRESSURE_DECAY_RATE = 0.1  # Natural pressure loss (steam to turbine)
    
    # Safety limits
    MAX_PRESSURE = 25.0  # MPa (Critical pressure)
    MIN_WATER_LEVEL = 10.0  # % (Low level trip)
    MAX_WATER_LEVEL = 90.0  # % (High level trip)
    CRITICAL_PRESSURE_THRESHOLD = 20.0  # MPa (Warning threshold)
    
    # Simulation timing
    UPDATE_INTERVAL = 0.1  # 100ms per physics tick
    
    def __init__(
        self,
        initial_water_level: float = 50.0,
        initial_pressure: float = 10.0,
        initial_temperature: float = 540.0
    ):
        """
        Initialize the boiler simulation
        
        Args:
            initial_water_level: Starting water level (0-100%)
            initial_pressure: Starting pressure (0-25 MPa)
            initial_temperature: Starting steam temperature (°C)
        """
        # State variables
        self.water_level = initial_water_level
        self.pressure = initial_pressure
        self.temperature = initial_temperature
        self.fire_intensity = 0.0  # Current fire setting
        
        # Status tracking
        self.status = "NORMAL"  # NORMAL, WARNING, CRITICAL, TRIPPED
        self.alarm_messages = []
        self.last_update_time = time.time()
        
        # History (for debugging/analysis)
        self.history = []
        
    def update(self, fire_intensity: float) -> Dict:
        """
        Run one physics simulation step
        
        Args:
            fire_intensity: User input for fire (0-100%)
            
        Returns:
            Dict containing current state {water_level, pressure, temperature, status}
            
        NOTE: This is the "game loop" - call this repeatedly from the API
        """
        # Store the input
        self.fire_intensity = max(0.0, min(100.0, fire_intensity))
        
        # Calculate time delta (for variable frame rates)
        current_time = time.time()
        dt = current_time - self.last_update_time
        self.last_update_time = current_time
        
        # ========================
        # STEP 1: STEAM GENERATION
        # ========================
        # High fire = more water turns to steam
        steam_generation_rate = self.fire_intensity * self.STEAM_CONVERSION_FACTOR
        
        # ========================
        # STEP 2: MASS BALANCE (Water Level)
        # ========================
        # Water IN (constant pump)
        water_inflow = self.FEEDWATER_INFLOW
        
        # Water OUT (evaporation from fire)
        water_outflow = steam_generation_rate
        
        # Net change
        net_water_change = (water_inflow - water_outflow) * dt / self.UPDATE_INTERVAL
        self.water_level += net_water_change
        
        # Clamp to physical limits (can't have negative water or overflow)
        self.water_level = max(0.0, min(100.0, self.water_level))
        
        # ========================
        # STEP 3: ENERGY BALANCE (Pressure)
        # ========================
        # Pressure increases from steam generation
        pressure_build = steam_generation_rate * self.PRESSURE_BUILD_RATE * dt / self.UPDATE_INTERVAL
        
        # Pressure decreases from steam extraction (turbine demand)
        pressure_loss = self.pressure * self.PRESSURE_DECAY_RATE * dt / self.UPDATE_INTERVAL
        
        # Net change
        net_pressure_change = pressure_build - pressure_loss
        self.pressure += net_pressure_change
        
        # Clamp to physical limits
        self.pressure = max(0.0, min(self.MAX_PRESSURE, self.pressure))
        
        # ========================
        # STEP 4: TEMPERATURE ESTIMATE
        # ========================
        # Temperature correlates with pressure and water level
        # Low water = superheating = high temp
        # High pressure = high saturation temp
        
        # Base temperature from pressure (saturation curve approximation)
        base_temp = 540 + (self.pressure / self.MAX_PRESSURE) * 60  # 540-600°C range
        
        # Superheat correction (low water causes temperature spike)
        if self.water_level < 30.0:
            superheat = (30.0 - self.water_level) * 2.0  # Up to +60°C if dry
            self.temperature = base_temp + superheat
        else:
            self.temperature = base_temp
            
        # ========================
        # STEP 5: SAFETY CHECKS
        # ========================
        self.alarm_messages = []
        
        if self.pressure > self.CRITICAL_PRESSURE_THRESHOLD:
            self.status = "CRITICAL_PRESSURE"
            self.alarm_messages.append(f"⚠️ CRITICAL: Pressure {self.pressure:.1f} MPa exceeds safe limit!")
            
        elif self.water_level < self.MIN_WATER_LEVEL:
            self.status = "LOW_LEVEL_TRIP"
            self.alarm_messages.append(f"🚨 TRIP: Drum level {self.water_level:.1f}% - Boiler shutdown!")
            
        elif self.water_level > self.MAX_WATER_LEVEL:
            self.status = "HIGH_LEVEL_TRIP"
            self.alarm_messages.append(f"🚨 TRIP: Drum level {self.water_level:.1f}% - Carryover risk!")
            
        elif self.water_level < 20.0 or self.pressure > 18.0:
            self.status = "WARNING"
            if self.water_level < 20.0:
                self.alarm_messages.append(f"⚠️ WARNING: Low drum level {self.water_level:.1f}%")
            if self.pressure > 18.0:
                self.alarm_messages.append(f"⚠️ WARNING: High pressure {self.pressure:.1f} MPa")
        else:
            self.status = "NORMAL"
        
        # ========================
        # STEP 6: RETURN STATE
        # ========================
        state = {
            "water_level": round(self.water_level, 2),
            "pressure": round(self.pressure, 2),
            "temperature": round(self.temperature, 2),
            "fire_intensity": round(self.fire_intensity, 2),
            "steam_generation": round(steam_generation_rate, 2),
            "status": self.status,
            "alarms": self.alarm_messages
        }
        
        # Store in history
        self.history.append(state.copy())
        if len(self.history) > 1000:  # Keep last 1000 samples
            self.history.pop(0)
            
        return state
    
    def reset(
        self,
        water_level: float = 50.0,
        pressure: float = 10.0,
        temperature: float = 540.0
    ):
        """
        Reset the simulation to initial conditions
        
        Args:
            water_level: Reset water level (0-100%)
            pressure: Reset pressure (0-25 MPa)
            temperature: Reset temperature (°C)
        """
        self.water_level = water_level
        self.pressure = pressure
        self.temperature = temperature
        self.fire_intensity = 0.0
        self.status = "NORMAL"
        self.alarm_messages = []
        self.history = []
        self.last_update_time = time.time()
        
    def get_state(self) -> Dict:
        """
        Get current state without updating physics
        
        Returns:
            Dict containing current state
        """
        return {
            "water_level": round(self.water_level, 2),
            "pressure": round(self.pressure, 2),
            "temperature": round(self.temperature, 2),
            "fire_intensity": round(self.fire_intensity, 2),
            "status": self.status,
            "alarms": self.alarm_messages
        }


# ========================
# Testing / Standalone Execution
# ========================

if __name__ == "__main__":
    """
    Test the physics engine standalone
    Run: python boiler_physics.py
    """
    print("="*60)
    print("DRUM BOILER PHYSICS ENGINE - TEST MODE")
    print("="*60)
    
    boiler = DrumBoilerPhysics()
    
    # Simulate 20 seconds at 100% fire
    print("\n🔥 Test 1: Fire at 100% (should crash from low water)")
    print("-"*60)
    
    for i in range(200):  # 200 ticks = 20 seconds
        state = boiler.update(fire_intensity=100.0)
        
        if i % 20 == 0:  # Print every 2 seconds
            print(f"t={i*0.1:.1f}s | Water: {state['water_level']:.1f}% | "
                  f"Pressure: {state['pressure']:.1f} MPa | "
                  f"Status: {state['status']}")
            
        if state['status'] in ["LOW_LEVEL_TRIP", "HIGH_LEVEL_TRIP", "CRITICAL_PRESSURE"]:
            print(f"\n❌ TRIPPED at t={i*0.1:.1f}s")
            for alarm in state['alarms']:
                print(f"   {alarm}")
            break
    
    # Reset and test equilibrium
    print("\n\n🔥 Test 2: Fire at 30% (equilibrium point)")
    print("-"*60)
    
    boiler.reset()
    
    for i in range(100):
        state = boiler.update(fire_intensity=30.0)
        
        if i % 20 == 0:
            print(f"t={i*0.1:.1f}s | Water: {state['water_level']:.1f}% | "
                  f"Pressure: {state['pressure']:.1f} MPa | "
                  f"Status: {state['status']}")
    
    print("\n✅ Physics engine test complete!")
