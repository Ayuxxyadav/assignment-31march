const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Category = require('./models/Category');


dotenv.config();
const app = express();


app.use(cors({
    origin: ["http://localhost:3000"], 

    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

app.use(morgan('dev'));



// database connection setup 

const MONGO_URI = process.env.MONGO_URI;


if (!MONGO_URI) {
  console.log("MongoDB URI is not found in .env file");
  return;
}


mongoose.connect(MONGO_URI, { autoIndex: true, })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


// Helper for pagination
const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};




// USER APIs

// Create User
app.post('/api/users', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const user = await User.create({ name, email });
    res.status(201).json({
      message: `successfully created ${user}`,
    });
  } catch (err) {
    next(err);
  }
});



// Get All Users (with pagination)
app.get('/api/users', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const [items, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);
    res.json({
      data: items,
      page,
      limit,
      total,    // total user kitne h
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});




// Get Single User
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});


// Delete User
app.delete('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});







// Category api

// Create Category
app.post('/api/categories', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Category name must be unique' });
    }
    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// Get All Categories (with pagination)
app.get('/api/categories', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [items, total] = await Promise.all([
      Category.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Category.countDocuments(),
    ]);
    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});





// Post apis



// Create Post
app.post('/api/posts', async (req, res, next) => {
  try {
    const { title, content, userId, categoryId } = req.body;

    if (!title || !content || !userId) {
      return res.status(400).json({ message: 'Title, content and userId are required' });
    }
    if (!mongoose.isValidObjectId(userId) || (categoryId && !mongoose.isValidObjectId(categoryId))) {
      return res.status(400).json({ message: 'Invalid userId or categoryId' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    let category = null;
    if (categoryId) {
      category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }
    const post = await Post.create({
      title,
      content,
      user: userId,
      category: categoryId || null,
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});




// Get All Posts (with pagination, latest first, optional search)
app.get('/api/posts', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const search = req.query.search;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate('user', 'name email')
        .populate('category', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Post.countDocuments(filter),
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});






// Get Post by ID (include user and comments data via aggregation)
app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const postAggregation = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments',
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]);

    if (!postAggregation.length) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(postAggregation[0]);
  } catch (err) {
    next(err);
  }
});





// Update Post

// yha title content category update ho jayegi 
app.put('/api/posts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }
    const { title, content, categoryId } = req.body;
    const update = {};
    if (title) update.title = title;
    if (content) update.content = content;

    if (categoryId) {
      if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId' });
      }
      const category = await Category.findById(categoryId);

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      update.category = categoryId;
    }
    const post = await Post.findByIdAndUpdate(id, update, { new: true });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});





// Comment api

// Add Comment
app.post('/api/posts/:postId/comments', async (req, res, next) => {
  try {

    const { postId } = req.params;

    const { userId, text } = req.body;

    if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid postId or userId' });
    }
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    const [post, user] = await Promise.all([Post.findById(postId), User.findById(userId)]);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const comment = await Comment.create({ post: postId, user: userId, text });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});


// Get Comments by Post (with pagination)
app.get('/api/posts/:postId/comments', async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid postId' });
    }
    const { page, limit, skip } = getPagination(req);
    const [items, total] = await Promise.all([
      Comment.find({ post: postId })
        .populate('user', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Comment.countDocuments({ post: postId }),
    ]);
    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});





// Top stats

app.get('/api/stats/top-users', async (req, res, next) => {
  try {
    const stats = await Post.aggregate([
      {
        $group: {
          _id: '$user',
          postCount: { $sum: 1 }, // count kr rhe k sbki post 
        },
      },
      { $sort: { postCount: -1 } },
      { $limit: 3 },   // ye limit h top 3 ki userid ki 
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,     // id nhi show krni 
          name: '$user.name',
          email: '$user.email',
          postCount: 1,    // 1 - on 0 - off 
        },
      },
    ])
    res.json(stats);
  } catch (err) {
    next(err);
  }
});





// 404 handler inavlid route k liye h 
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});




// Global error handler

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

