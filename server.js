'use strict';

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const Recipe = require('./models/recipe');

const { PORT, MONGODB_URI, CLIENT_ORIGIN } = require('./config');

// Create an Express application
const app = express();

// Log all requests. Skip logging during testing
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

// Create a static webserver 
//this is a test for the server, will replace with react client side)
app.use(express.static('public'));

// Parse request body
app.use(express.json());

/* ========== GET/READ ALL RECIPES ========== */
app.get('/api/recipes/', (req, res, next) => {
  const { searchTerm } = req.query;
  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'desc': re}];
  }

  Recipe
    .find(filter)
    .sort('id')
    .then(recipes => {
      res.json(recipes);
    })
    .catch(
      err => next(err)
    );
});

/* ========== GET/READ A SINGLE RECIPE ========== */

app.get('/api/recipes/:id', (req, res, next) => {
  const { id } = req.params;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Recipe.findOne({ _id: id })
    .then(result => { 
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch( err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
app.post('/api/recipes/', (req, res, next) => {
  console.log(req.body);
  const { cook, desc, directions, imgUrl, ing, prep, title } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!desc) {
    const err = new Error('Missing `description` in request body');
    err.status = 400;
    return next(err);
  }

  const newRecipe = { cook, desc, directions, imgUrl, ing, prep, title };

  Recipe.create(newRecipe)
    .then( result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch( err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
app.put('/api/recipes/:id', (req, res, next) => {
  const { id } = req.params;
  const toUpdate = {};
  const updateableFields = [ 'cook', 'desc', 'directions', 'imgUrl', 'ing', 'prep', 'title'];

  updateableFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Recipe.findOneAndUpdate({ _id: id}, toUpdate, { new: true})
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
app.delete('/api/recipes/:id', (req, res, next) => {
  const { id } = req.params;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Recipe.findOneAndRemove({ _id: id})
    .then(() => {
      res.sendStatus(204);
    })
    .catch( err => next(err));
});



// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error first handler
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
    console.log(err.name === 'FakeError' ? '' : err);
  }
});

// Listen for incoming connections
if (require.main === module) { //prevents server from automatically running when we run tests
  // Connect to DB and Listen for incoming connections
  mongoose.connect(MONGODB_URI)
    .then(instance => {
      const conn = instance.connections[0];
      console.info(`Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      console.error(err);
    });

  app.listen(PORT, function () {
    console.info(`Server listening on ${this.address().port}`);
  }).on('error', err => {
    console.error(err);
  });
}

module.exports = app; // Export for testing