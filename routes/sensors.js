// routes/sensors.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Function to get data from all collections
const getAllCollectionsData = async (res) => {
    try {
      const collectionsCursor = mongoose.connection.db.listCollections();
      const collections = await collectionsCursor.toArray();
  
      const allData = {};
      for (const collection of collections) {
        const collectionName = collection.name;
        const collectionData = await mongoose.connection.db.collection(collectionName).find({}).toArray();
        allData[collectionName] = collectionData;
      }
  
      res.json(allData);
    } catch (error) {
      console.error('Error fetching data from all collections:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  // Route to get data from all collections
  router.get('/sensors', async (req, res) => {
    await getAllCollectionsData(res);
  });
  
  // Route to get data from all collections based on date range
  router.get('/sensors/all/:from/:to', async (req, res) => {
    const fromTimestamp = new Date(req.params.from);
    const toTimestamp = new Date(req.params.to);
  
    try {
      const collectionsCursor = mongoose.connection.db.listCollections();
      const collections = await collectionsCursor.toArray();
  
      const allCollectionsData = await Promise.all(
        collections.map(async (collection) => {
          const data = await mongoose.connection.db
            .collection(collection.name)
            .find({
              time: { $gte: fromTimestamp, $lte: toTimestamp },
            })
            .toArray();
          return { [collection.name]: data };
        })
      );
  
      res.json(allCollectionsData);
    } catch (error) {
      console.error('Error fetching data from all collections within date range:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Route to get the last result from all collections
  router.get('/sensors/all/last', async (req, res) => {
    try {
      const collectionsCursor = mongoose.connection.db.listCollections();
      const collections = await collectionsCursor.toArray();
  
      const allCollectionsData = await Promise.all(
        collections.map(async (collection) => {
          const data = await mongoose.connection.db
            .collection(collection.name)
            .find({})
            .sort({ time: -1 })
            .limit(1)
            .toArray();
          return { [collection.name]: data };
        })
      );
  
      res.json(allCollectionsData);
    } catch (error) {
      console.error('Error fetching last result from all collections:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
// Route to get data from a specific collection
router.get('/sensors/:collectionName', async (req, res) => {
  const collectionName = req.params.collectionName;

  try {
    const collectionData = await mongoose.connection.db.collection(collectionName).find({}).toArray();
    res.json(collectionData);
  } catch (error) {
    console.error(`Error fetching data from collection ${collectionName}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/sensors/:collectionName/:from/:to', async (req, res) => {
    const collectionName = req.params.collectionName;
    const fromTimestamp = new Date(req.params.from);
    const toTimestamp = new Date(req.params.to);
  
    try {
      const collectionData = await mongoose
        .connection
        .db
        .collection(collectionName)
        .find({
          time: { $gte: fromTimestamp, $lte: toTimestamp },
        })
        .toArray();
  
      res.json(collectionData);
    } catch (error) {
      console.error(`Error fetching data from collection ${collectionName} within date range:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  router.get('/sensors/:collectionName/last', async (req, res) => {
    const collectionName = req.params.collectionName;
  
    try {
      const collectionData = await mongoose
        .connection
        .db
        .collection(collectionName)
        .find({})
        .sort({ time: -1 }) // Sort in descending order based on the 'time' field
        .limit(1) // Limit to only retrieve the first result
        .toArray();
  
      res.json(collectionData);
    } catch (error) {
      console.error(`Error fetching last result from collection ${collectionName}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
module.exports = router;
