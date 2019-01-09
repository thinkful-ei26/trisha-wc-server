'use strict';

//test requirements
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');
const sinon = require('sinon');

//connect to server
const app = require('../server');
const { TEST_DATABASE_URL } = require('../config');

//schemas
const Recipe = require('../models/recipe');

//data
const { recipes } = require('../db/data');

//mount chaiHttp so you can use it
chai.use(chaiHttp);

//needed syntax to test endpoints
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('What\'s Cooking API - Recipes', () => {

  before( () => {
    //connect to test db, blow away any existing collections
    return mongoose.connect(TEST_DATABASE_URL , { useNewUrlParser: true })
      .then(() => Promise.all([
        Recipe.deleteMany(),
      ]));
  });

  beforeEach( () => {
    return Promise.all([
      Recipe.insertMany(recipes)
    ]);
  });

  afterEach(() => {
    sandbox.restore();  // restore the previous state of db after each test  
    return Promise.all([
      Recipe.deleteMany(),
    ]);
  });

  after( () => {
    return mongoose.connection.db.dropDatabase().then(() => mongoose.disconnect());
  });

 
  describe('GET /api/recipes', () => {

    it('should return the correct number of Recipes', () => {
      return Promise.all([
        Recipe.find(),
        chai.request(app)
          .get('/api/recipes')
      ])
        .then(([data, res]) => {
          console.log('res', res);
          console.log('data', data);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

  });

});
