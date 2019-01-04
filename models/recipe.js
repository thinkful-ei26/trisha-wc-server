'use strict';

const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {type: String, required: true},
  desc: {type: String, required: true},
  ing: [{
    type: String, required: true
  }],
  imgUrl: String,
  serving: String,
  prep: String,
  cook: String,
  directions: {type: String, required: true}, 
  expanded: {type: Boolean, default: false }
});

//this is like the address 
recipeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

//create serialize method

module.exports = mongoose.model('Recipe', recipeSchema);