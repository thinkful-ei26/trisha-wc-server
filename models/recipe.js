'use strict';

const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {type: String, required: true},
  desc: {type: String, required: true},
  ing: [{
    type: String, required: true
  }],
  imgUrl: String,
  prep: String,
  cook: String,
  directions: {type: String, required: true}, 
  condensed: {type: Boolean, default: true }
});

recipeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

module.exports = mongoose.model('Recipe', recipeSchema);