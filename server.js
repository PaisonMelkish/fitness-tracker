const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Initialize app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'pages'))); // Serve static files from 'pages' directory

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/workout', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// JWT Secret Key
const JWT_SECRET = '2a56ef64e2b0fa562eb2c58b79b8d69b7d3b3445474345fd62265df135fd1e26';

// User Schema and Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Password hashing before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Exercise Schema and Model
const exerciseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    cardiovascular: {
        minutes: { type: Number, default: 0 },
        caloriesBurned: { type: Number, default: 0 }
    },
    strengthTraining: {
        sets: { type: Number, default: 0 },
        repsPerSet: { type: Number, default: 0 },
        weightPerSet: { type: Number, default: 0 }
    },
    notes: { type: String, default: '' }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Middleware for verifying JWT
const authenticate = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'exercise.html'));
});

// Signup Route
app.post('/api/auth/signup', async(req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ email, password });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, message: 'Signup successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Route
app.post('/api/auth/login', async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Exercise Route
app.post('/api/exercise/add', authenticate, async(req, res) => {
    const { cardiovascular, strengthTraining, notes } = req.body;

    try {
        const newExercise = new Exercise({
            userId: req.userId,
            cardiovascular,
            strengthTraining,
            notes
        });

        await newExercise.save();
        res.status(201).json({ message: 'Exercise added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});