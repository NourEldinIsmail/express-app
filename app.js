const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();
const mongoClient = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
let db;

const startConnection = async () => {
  try {
    db = mongoClient.db('sports-project');
    console.log("Connection to Database established");
    await mongoClient.connect();
  } catch (error) {
    console.log("Error connecting to Database", error);
  }
};

startConnection();

const requestLogger = (request, response, next) => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${request.method} request to ${request.path}`);
    console.log('Request body:', request.body);
    next();
};

const allowCrossDomain = (request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
    response.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

app.use(allowCrossDomain);
app.use(express.json());
app.use(requestLogger);
app.use('/images', express.static('images'));

app.post('/order', async (request, response) => {
    try {
        const order = request.body;
        const result = await db.collection('orders').insertOne(order);
        response.json(result);
    } catch (error) {
        response.status(500).json({ message: "Order coudn't be placed", error });
    }
});

app.put('/lesson', async (request, response) => {
    if (!request.body.id) {
        response.status(400).json({ message: "Missing id field" });
    }

    try {
        const result = await db.collection('lessons').updateOne(
            { id: Number(request.body.id) },
            { $set: request.body }
        );
        if (result.matchedCount === 0) {
            response.status(404).json({ message: "There is no lesson with this id" });
        } else {
            response.json(result);
        }
    } catch (error) {
        response.status(500).json({ message: "Lesson coudn't be updated", error });
    }
});

app.get('/lessons', async (request, response) => {
  try {
    const lessons = await db.collection('lessons').find().toArray();
    response.json(lessons);
  } catch (error) {
    response.status(500).json({ message: "Failed to retrieve lessons", error });
  }
});

app.get('/search', async (request, response) => {
  try {
    const stringRegex = new RegExp(request.query.q, 'i');
    const numRegex = new RegExp(`^${request.query.q}$`, 'i');
    const lessons = await db.collection('lessons').find({
      $or: [
        { Sport: { $regex: stringRegex } },
        { Location: { $regex: stringRegex } },
        { Price: { $regex: stringRegex } },
        { Spaces: Number(request.query.q) }
      ]
    }).toArray();
    response.json(lessons);
  } catch (error) {
    response.status(500).json({ message: "Search failed" });
  }
});

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});