const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();
const mongoClient = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
let db;

const startConnection = async () => {
    await mongoClient.connect();
    db = mongoClient.db('sports-project');
    console.log("Connection to Database established");
};

startConnection();

const requestLogger = (req, res, next) => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${req.method} request to ${req.path}`);
    console.log('Request body:', req.body);
    next();
};

const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

app.use(allowCrossDomain);
app.use(express.json());
app.use(requestLogger);
app.use('/images', express.static('images'));

app.post('/order', async (req, res) => {
    try {
        const order = req.body;
        const result = await db.collection('orders').insertOne(order);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Order coudn't be placed", error });
    }
});

app.put('/lesson', async (req, res) => {
    if (!req.body.id) {
        res.status(400).json({ message: "Missing id field" });
    }

    try {
        const result = await db.collection('lessons').updateOne(
            { id: Number(req.body.id) },
            { $set: req.body }
        );
        if (result.matchedCount === 0) {
            res.status(404).json({ message: "There is no lesson with this id" });
        } else {
            res.json(result);
        }
    } catch (error) {
        res.status(500).json({ message: "Lesson coudn't be updated", error });
    }
});

app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find().toArray();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve lessons", error });
  }
});

app.get('/search', async (req, res) => {
  try {
    const stringRegex = new RegExp(req.query.q, 'i');
    const numRegex = new RegExp(`^${req.query.q}$`, 'i');
    const lessons = await db.collection('lessons').find({
      $or: [
        { Sport: { $regex: stringRegex } },
        { Location: { $regex: stringRegex } },
        { Price: { $regex: stringRegex } },
        { Spaces: { $regex: numRegex } }
      ]
    }).toArray();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Search failed", error });
  }
});

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});