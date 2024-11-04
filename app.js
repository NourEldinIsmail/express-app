const express = require('express');
const dotenv = require('dotenv');
const { connectDB, getDB } = require('./config/db');

dotenv.config();

const app = express();

connectDB();

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(req.method, req.hostname, req.path, timestamp);
  next();
};

app.use(express.json());
app.use(logger);
app.use('/images', express.static('images'));

app.use('/images', (req, res) => {
    res.status(404).json({ message: 'Image not found' });
});

app.get('/lessons', async (req, res) => {
    try {
        if (req.query.search) {
            const db = getDB();
            const lessons = await db.collection('lessons').find({
                $or: [
                    { Sport: { $regex: req.query.search, $options: 'i' } },
                    { Location: { $regex: req.query.search, $options: 'i' } },
                    { Price: { $regex: req.query.search, $options: 'i' } },
                    { Spaces: { $regex: req.query.search, $options: 'i' } }
                ]
            }).toArray();
            res.json(lessons);
        }
        else{
            const db = getDB();
            const lessons = await db.collection('lessons').find().toArray();
            res.json(lessons);
        }
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch lessons", error });
    }
});

app.post('/order', async (req, res) => {
    try {
        const db = getDB();
        const order = req.body;
        const result = await db.collection('orders').insertOne(order);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to insert order", error });
    }
});

app.put('/lesson/:id', async (req, res) => {
    if (!req.query.spaces) {
        res.status(400).json({ message: "Spaces query parameter is required" });
        return;
    }
    if (isNaN(Number(req.query.spaces))) {
        res.status(400).json({ message: "Spaces query parameter must be a number" });
        return;
    }
    try {
        const db = getDB();
        const result = await db.collection('lessons').updateOne({ id: Number(req.params.id) }, { $set: { Spaces: Number(req.query.spaces) } });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to update lesson", error });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
