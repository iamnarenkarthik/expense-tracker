require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// Expense Model
const expenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Petrol', 'Medical', 'Outside Food', 'Water', 'Groceries', 
           'Mobile Recharge', 'Electricity bill', 'Vegetable and Fruits',
           'Clothing', 'Milk and Diary', 'Eggs', 'Non Veg', 'Snacks and Juice',
           '750 ml and Royal cafe', 'Haircut', 'Bike', 'miscellanous']
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'GPay', 'Card', 'UPI'],
    default: 'Cash'
  },
  date: { type: Date, required: true, default: Date.now }
});

const Expense = mongoose.model('Expense', expenseSchema);

// API Endpoints
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let query = {};
    
    if (date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    
    if (month && year) {
      const start = new Date(`${year}-${month}-01`);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }
    
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});


app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
