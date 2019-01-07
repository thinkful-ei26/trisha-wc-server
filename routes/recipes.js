'use strict';

const express = require('express');
const mongoose = require('mongoose');
const Recipe = require('../models/recipe');
const router = express.Router();


/* ========== GET/READ ALL RECIPES ========== */
router.get('/', (req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin');
  const { search } = req.query;
  let filter = {};

  console.log(req.query);

  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ 'title': re }, { 'desc': re}];
  }

  Recipe
    .find(filter)
    .sort('title')
    .then(recipes => {
      res.json(recipes);
    })
    .catch(
      err => next(err)
    );
});

/* ========== GET/READ A SINGLE RECIPE ========== */

router.get('/:id', (req, res, next) => {
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
router.post('/', (req, res, next) => {
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
router.put('/:id', (req, res, next) => {
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
router.delete('/:id', (req, res, next) => {
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

module.exports = router;