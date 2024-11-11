// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Database connection
mongoose.connect('mongodb://localhost:27017/office-hours', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Models
const Professor = require('./models/professor');
const Request = require('./models/request');

// Serve static files
app.get('/request', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/request.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin.html'));
});

app.get('/approved', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/approved.html'));
});

// API Routes
app.get('/api/professors', async (req, res) => {
  try {
    const professors = await Professor.find({}, '-password');
    res.json(professors);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const professor = await Professor.findOne({ username });
    if (!professor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await professor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ id: professor._id, name: professor.name });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}); */



app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const professor = await Professor.findOne({ username });

    if (!professor) {
      console.log(`Professor with username "${username}" not found on the server.`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = password == professor.password;
    if (!isMatch) {
      console.log(`Incorrect password entered for username "${username}". Entered password: "${password}", Correct (hashed) password: "${professor.password}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Successful login for username "${username}". Entered password: "${password}" matches the stored password.`);
    res.json({ id: professor._id, name: professor.name });

  } catch (error) {
    console.log(`Server error during login attempt for username "${username}":`, error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/requests', async (req, res) => {
  const { studentName, email, professorId } = req.body;
  try {
    // Check for existing request
    const existingRequest = await Request.findOne({
      email,
      professor: professorId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Request already exists' });
    }

    const request = new Request({
      studentName,
      email,
      professor: professorId,
      status: 'pending'
    });
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/requests/:professorId', async (req, res) => {
  try {
    const requests = await Request.find({
      professor: req.params.professorId,
      status: 'pending'
    }).populate('professor');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/approved-requests', async (req, res) => {
  try {
    const requests = await Request.find({
      status: 'approved'
    }).populate('professor');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/requests/:id/approve', async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize database with sample professors
async function initializeDatabase() {
  try {
    const count = await Professor.countDocuments();
    if (count === 0) {
      const professors = [
        { name: 'Dr. John Smith', username: 'jsmith', password: 'pass123', officeHours: 'Monday 2-4 PM' },
        { name: 'Dr. Sarah Johnson', username: 'sjohnson', password: 'pass123', officeHours: 'Tuesday 1-3 PM' },
        { name: 'Dr. Michael Brown', username: 'mbrown', password: 'pass123', officeHours: 'Wednesday 3-5 PM' },
        { name: 'Dr. Emily Davis', username: 'edavis', password: 'pass123', officeHours: 'Thursday 10-12 PM' },
        { name: 'Dr. Robert Wilson', username: 'rwilson', password: 'pass123', officeHours: 'Friday 2-4 PM' },
        { name: 'Dr. Lisa Anderson', username: 'landerson', password: 'pass123', officeHours: 'Monday 10-12 PM' },
        { name: 'Dr. James Taylor', username: 'jtaylor', password: 'pass123', officeHours: 'Tuesday 3-5 PM' },
        { name: 'Dr. Patricia Martinez', username: 'pmartinez', password: 'pass123', officeHours: 'Wednesday 1-3 PM' },
        { name: 'Dr. David Lee', username: 'dlee', password: 'pass123', officeHours: 'Thursday 2-4 PM' },
        { name: 'Dr. Jennifer White', username: 'jwhite', password: 'pass123', officeHours: 'Friday 10-12 PM' }
      ];
      await Professor.insertMany(professors);
      console.log('Database initialized with sample professors');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  initializeDatabase();
});
