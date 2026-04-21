// =====================================================
// SHARED FLEET SERVICE
// Centralized fleet management for Page1 & Fleet Management
// =====================================================

import { getVessels } from '../services/apiService';

const FLEET_STORAGE_KEY = 'app_fleet_vessels';

class FleetService {
  constructor() {
    this.initializeFleet();
  }

  // Initialize fleet from API
  async initializeFleet() {
    try {
      const vessels = await getVessels();
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(vessels));
      console.log('✅ Fleet initialized from API:', vessels.length, 'boats');
    } catch (error) {
      console.error('Error loading fleet from API:', error);
    }
  }

  // Get all boats
  getAllBoats() {
    try {
      const stored = localStorage.getItem(FLEET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading fleet:', error);
      return [];
    }
  }

  // Get boats grouped by category (for Page1 dropdown)
  getBoatsByCategory() {
    const boats = this.getAllBoats();
    const grouped = {};
    
    boats.forEach(boat => {
      if (!grouped[boat.type]) {
        grouped[boat.type] = [];
      }
      grouped[boat.type].push(boat.name);
    });
    
    return grouped;
  }

  // Add a new boat
  addBoat(boat) {
    try {
      const boats = this.getAllBoats();
      
      // Check for duplicate ID
      if (boats.find(b => b.id.toUpperCase() === boat.id.toUpperCase())) {
        throw new Error(`Boat with ID "${boat.id}" already exists`);
      }
      
      boats.push({
        id: boat.id.toUpperCase(),
        name: boat.name,
        type: boat.type,
        model: boat.model || '',
        createdAt: new Date().toISOString()
      });
      
      boats.sort((a, b) => a.id.localeCompare(b.id));
      
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(boats));
      console.log('✅ Boat added:', boat.id);
      
      return true;
    } catch (error) {
      console.error('Error adding boat:', error);
      throw error;
    }
  }

  // Remove a boat
  removeBoat(boatId) {
    try {
      const boats = this.getAllBoats();
      const filtered = boats.filter(b => b.id !== boatId);
      
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Boat removed:', boatId);
      
      return true;
    } catch (error) {
      console.error('Error removing boat:', error);
      return false;
    }
  }

  // Update a boat
  updateBoat(boatId, updates) {
    try {
      const boats = this.getAllBoats();
      const index = boats.findIndex(b => b.id === boatId);
      
      if (index === -1) {
        throw new Error(`Boat with ID "${boatId}" not found`);
      }
      
      boats[index] = {
        ...boats[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(boats));
      console.log('✅ Boat updated:', boatId);
      
      return true;
    } catch (error) {
      console.error('Error updating boat:', error);
      throw error;
    }
  }

  // Get boat by ID
  getBoatById(boatId) {
    const boats = this.getAllBoats();
    return boats.find(b => b.id === boatId);
  }

  // Get categories
  getCategories() {
    const boats = this.getAllBoats();
    const categories = [...new Set(boats.map(b => b.type))];
    return categories.sort();
  }

  // Add category to a boat
  addCategory(categoryName) {
    // Categories are implicit from boat types
    // This method is for future expansion
    console.log('Category:', categoryName);
  }

  // Clear all boats (admin only)
  clearAllBoats() {
    localStorage.removeItem(FLEET_STORAGE_KEY);
    console.log('🗑️ All boats cleared');
  }

  // Reset to initial fleet from API
  async resetToInitial() {
    try {
      const vessels = await getVessels();
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(vessels));
      console.log('🔄 Fleet reset from API:', vessels.length, 'boats');
    } catch (error) {
      console.error('Error resetting fleet from API:', error);
    }
  }
}

// Export singleton instance
const fleetService = new FleetService();
export default fleetService;