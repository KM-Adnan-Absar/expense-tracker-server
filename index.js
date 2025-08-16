const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bumjh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db('expenseTracker');
    const expenseCollection = db.collection('expenses');

    // Add expense
    app.post('/expenses', async (req, res) => {
      const expenseData = req.body;

      if (expenseData.title.trim().length < 3) {
        return res.status(400).json({ error: 'Title must be at least 3 characters long.' })
      }
      if (isNaN(expenseData.amount) || Number(expenseData.amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a number and greater than 0.' })
      }
      if (isNaN(Date.parse(expenseData.date))) {
        return res.status(400).json({ error: 'Date must be a valid date.' })
      }

      const result = await expenseCollection.insertOne(expenseData);
      res.send(result);
    });

    // Get all expenses with optional category filter
    app.get('/expenses', async (req, res) => {
      const { category } = req.query;
      let query = {};

      if (category) {
        query.category = category;
      }

      const expenses = await expenseCollection.find(query).toArray();
      res.send(expenses);
    });

    // Update expense
    app.patch('/expenses/:id', async (req, res) => {
      const expense = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date
        }
      }
      const result = await expenseCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // Get a single expense by ID
    app.get('/expenses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await expenseCollection.findOne(query);
      res.send(result);
    });


    // Delete expense
    app.delete('/expenses/:id', async (req, res) => {
      const id = req.params.id;
      const result = await expenseCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    console.log("MongoDB connected successfully");
  } finally {
    // await client.close(); // keep server running
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Personal Expense Tracking');
});

app.listen(port, () => {
  console.log(`Expense server running on port ${port}`);
});