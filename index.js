const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');
const multer = require('multer');

dotenv.config();
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const JWT_SECRET = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
}));
app.use('/uploads', express.static('uploads'));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory where you want to save the uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Rename the file to avoid conflicts
    }
});
const upload = multer({ storage: storage });

// Route to handle file uploads
app.get('/profile', async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, {}, (err, userData) => {
      if (err) {
        console.error('Error verifying JWT:', err);
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        res.json(userData);
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    if (password === foundUser.password) {
      jwt.sign({ userId: foundUser._id, username: foundUser.username }, JWT_SECRET, {}, (err, token) => {
        if (err) {
          console.error('Error signing JWT:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.cookie('token', token, { sameSite: 'none', secure: true }).json({
            id: foundUser._id,
            username: foundUser.username,
          });
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/data', async (req, res) => {
  const username = req.body.user;
  try {
    const foundUser = await User.findOne({ username });
    res.json(foundUser);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/addblog', upload.single('image'), async (req, res) => {
    // Extract other form data from the request body
    const { username, heading, summary } = req.body;
    console.log("username", username);
    console.log("heading", heading);
    console.log("summary", summary);

    // Extract the image file from the request
    res.send('Image uploaded');
    const image = req.file.filename;
    try{
        const createdPost = await Post.create({ username, heading, summary, image });
        console.log('Post created:', createdPost);
        // res.status(201).json({ id: createdPost._id });
    }
    catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
    // Handle the rest of your logic here
});
    // Check if an image file was uploaded
    
    // Handle the rest of your logic here


app.get('/blogs', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const createdUser = await User.create({ username, email, password });

    jwt.sign({ userId: createdUser._id, username }, JWT_SECRET, {}, (err, token) => {
      if (err) {
        console.error('Error signing JWT:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
          id: createdUser._id,
          username,
        });
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const server = app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

module.exports = server;
