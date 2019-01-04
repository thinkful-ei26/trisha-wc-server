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

recipeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

recipeSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title, 
    desc: this.desc, 
    ing: this.ing, 
    imgUrl: this.imgUrl,
    serving: this.serving, 
    prep: this.prep,
    cook: this.cook, 
    directions: this.directions
  };
};

module.exports = mongoose.model('Recipe', recipeSchema);