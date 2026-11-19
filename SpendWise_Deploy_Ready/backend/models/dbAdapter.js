// Local Storage Fallback Adapter
// Provides a transparent fallback when MongoDB service is not running locally.
// If MongoDB is connected, all operations use Mongoose directly.

const fs = require('fs');
const path = require('path');
const { getIsConnected } = require('../config/db');

const dataFilePath = path.join(__dirname, '..', 'data', 'local_db.json');

// Initialize local database file if it does not exist
const initLocalDB = () => {
  if (!fs.existsSync(dataFilePath)) {
    const initialData = {
      users: [],
      transactions: [],
      budgets: [],
      goals: [],
      subscriptions: [],
      splitBills: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
      let modified = false;
      if (!data.subscriptions) { data.subscriptions = []; modified = true; }
      if (!data.splitBills) { data.splitBills = []; modified = true; }
      if (modified) {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (e) {}
  }
};

initLocalDB();

// Helper to read local data
const readLocalDB = () => {
  try {
    initLocalDB();
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local db:', error);
    return { users: [], transactions: [], budgets: [], goals: [] };
  }
};

// Helper to write local data
const writeLocalDB = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local db:', error);
  }
};

// Generate simple unique ID for local items
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Wrapper function to unify Mongoose and Local Fallback
const createModelAdapter = (collectionName, MongooseModel) => {
  return {
    // Return underlying Mongoose model if needed
    mongooseModel: MongooseModel,

    // Find documents matching filter
    async find(filter = {}) {
      if (getIsConnected()) {
        return await MongooseModel.find(filter).sort({ date: -1, createdAt: -1 }).lean();
      }
      
      const db = readLocalDB();
      const items = db[collectionName] || [];
      return items.filter(item => {
        for (const [key, val] of Object.entries(filter)) {
          if (item[key] !== val) return false;
        }
        return true;
      }).reverse();
    },

    // Find single document matching filter
    async findOne(filter = {}) {
      if (getIsConnected()) {
        return await MongooseModel.findOne(filter).lean();
      }

      const db = readLocalDB();
      const items = db[collectionName] || [];
      return items.find(item => {
        for (const [key, val] of Object.entries(filter)) {
          if (item[key] !== val) return false;
        }
        return true;
      }) || null;
    },

    // Find document by ID
    async findById(id) {
      if (getIsConnected()) {
        return await MongooseModel.findById(id).lean();
      }

      const db = readLocalDB();
      const items = db[collectionName] || [];
      return items.find(item => item._id === id || item.id === id) || null;
    },

    // Create a new document
    async create(docData) {
      if (getIsConnected()) {
        const doc = new MongooseModel(docData);
        return await doc.save();
      }

      const db = readLocalDB();
      if (!db[collectionName]) db[collectionName] = [];
      
      const newItem = {
        _id: generateId(),
        ...docData,
        createdAt: new Date().toISOString()
      };
      
      db[collectionName].push(newItem);
      writeLocalDB(db);
      return newItem;
    },

    // Update document by ID
    async findByIdAndUpdate(id, updateData, options = { new: true }) {
      if (getIsConnected()) {
        return await MongooseModel.findByIdAndUpdate(id, updateData, options).lean();
      }

      const db = readLocalDB();
      const items = db[collectionName] || [];
      const index = items.findIndex(item => item._id === id || item.id === id);
      
      if (index === -1) return null;

      // Handle increment operator ($inc) if present
      let updated = { ...items[index] };
      if (updateData.$inc) {
        for (const [key, amount] of Object.entries(updateData.$inc)) {
          updated[key] = (Number(updated[key]) || 0) + Number(amount);
        }
        delete updateData.$inc;
      }

      updated = {
        ...updated,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      items[index] = updated;
      db[collectionName] = items;
      writeLocalDB(db);
      return updated;
    },

    // Delete document by ID
    async findByIdAndDelete(id) {
      if (getIsConnected()) {
        return await MongooseModel.findByIdAndDelete(id).lean();
      }

      const db = readLocalDB();
      const items = db[collectionName] || [];
      const itemToDelete = items.find(item => item._id === id || item.id === id);
      
      if (!itemToDelete) return null;

      db[collectionName] = items.filter(item => item._id !== id && item.id !== id);
      writeLocalDB(db);
      return itemToDelete;
    }
  };
};

module.exports = {
  createModelAdapter,
  readLocalDB,
  writeLocalDB
};
