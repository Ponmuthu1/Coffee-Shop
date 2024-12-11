const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// Connect to MongoDB
//mongodb+srv://manishankar:mani1430fire@sourcing.z6c6p.mongodb.net/?retryWrites=true&w=majority&appName=sourcing
mongoose.connect('mongodb://localhost:27017/coffee-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Model
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

// Coffee Item Model
const CoffeeItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
});

const CoffeeItem = mongoose.model('CoffeeItem', CoffeeItemSchema);

// Order Model
const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  date: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', OrderSchema);

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const user = new User({ username, email, password });
    await user.save();
    res.json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      res.json({ message: 'Login successful', userId: user._id, username: user.username });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Middleware to check if user is authenticated
const auth = async (req, res, next) => {
  const userId = req.headers['userid'];
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.userId = userId;
    req.username = user.username;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Route to get user info
app.get('/user', auth, (req, res) => {
  res.json({ username: req.username });
});

// Coffee Item Routes
app.get('/menu', async (req, res) => {
  try {
    const items = await CoffeeItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve menu' });
  }
});

// Order Routes
app.post('/order', auth, async (req, res) => {
  const { items, totalAmount } = req.body;
  try {
    const order = new Order({ userId: req.userId, items, totalAmount });
    await order.save();
    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order' });
  }
});

app.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
});

// Insert sample data into CoffeeItem collection if not already present
const sampleItems = [
  {
    name: 'Espresso',
    description: 'A strong and bold coffee shot.',
    price: 100,
    image: 'images/espresso.jpg'
  },
  {
    name: 'Cappuccino',
    description: 'A perfect blend of espresso, steamed milk, and foam.',
    price: 150,
    image: 'images/cappuccino.jpg'
  },
  {
    name: 'Latte',
    description: 'A smooth and creamy coffee with steamed milk.',
    price: 180,
    image: 'images/latte.jpg'
  }
];

(async () => {
  try {
    const items = await CoffeeItem.find();
    if (items.length === 0) {
      await CoffeeItem.insertMany(sampleItems);
      console.log('Sample items added');
    }
  } catch (err) {
    console.error('Failed to add sample items', err);
  }
})();

app.listen(5000, () => {
  console.log('Server started on port 5000');
});