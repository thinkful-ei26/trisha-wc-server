'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Recipe = require('../models/recipe');

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => {
    const searchTerm = 'zucchini';
    let filter = {};

    if (searchTerm) {
      filter.title = { $regex: searchTerm, $options: 'i' };
    }

    return Recipe.find(filter).sort({ updatedAt: 'desc' });
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });