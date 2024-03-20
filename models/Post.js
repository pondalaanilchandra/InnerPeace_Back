const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  heading: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Assuming the image is stored as a URL/path; adjust as needed
    required: true,

  },
},{timestamps:true});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
