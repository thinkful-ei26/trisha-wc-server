'use strict';

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { PORT, DATABASE_URL } = require('./config');

// Create an Express application
const app = express();

// Log all requests. Skip logging during
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// Create a static webserver 
//this is a test for the server, will replace with react client side)
app.use(express.static('public'));

// Parse request body
app.use(express.json());

//Mount routers/routes
app.get('/api/recipes', (req, res) => {
  const recipes = [
    'Zuchinni Meatballs', 
    'Bacon', 
    'Empanada'
  ];
  return res.json(recipes);
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
  mongoose.connect(DATABASE_URL)
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