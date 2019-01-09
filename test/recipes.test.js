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
const { recipes } = require('../db/test.data');

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
          // console.log('res', res);
          // console.log('data', data);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list sorted by title with the correct right fields', () => {
      return Promise.all([
        Recipe.find().sort({ _id: recipes.id }),
        chai.request(app)
          .get('/api/recipes')
      ])
        .then(([data, res]) => {
          // console.log('res.body', res.body);
          // console.log('data', data);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach( (item, i) => {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys(
              'id', 'title', 'desc', 'ing', 'imgUrl', 'serving', 'prep', 'cook', 'directions', 'expanded');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.desc).to.equal(data[i].desc);
            expect(item.ing.length).to.equal(data[i].ing.length);
            expect(item.imgUrl).to.equal(data[i].imgUrl);
            expect(item.serving).to.equal(data[i].serving);
            expect(item.prep).to.equal(data[i].prep);
            expect(item.cook).to.equal(data[i].cook);
            expect(item.directions).to.equal(data[i].directions);
          });
        });
    });

    it('should return correct search results for a title search', () => {
      const searchTerm = 'gin';

      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Recipe
        .find({ $or: [{ title: re }, { content: re }] });

      const apiPromise = chai.request(app)
        .get(`/api/recipes?search=${searchTerm}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys(
              'id', 'title', 'desc', 'ing', 'imgUrl', 'serving', 'prep', 'cook', 'directions', 'expanded');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.desc).to.equal(data[i].desc);
            expect(item.ing.length).to.equal(data[i].ing.length);
            expect(item.imgUrl).to.equal(data[i].imgUrl);
            expect(item.serving).to.equal(data[i].serving);
            expect(item.prep).to.equal(data[i].prep);
            expect(item.cook).to.equal(data[i].cook);
            expect(item.directions).to.equal(data[i].directions);
          });
        });
    });

    it('should catch errors and respond properly', () => {
      sandbox.stub(Recipe.schema.options.toJSON, 'transform').throws('FakeError');

      return chai.request(app)
        .get('/api/recipes')
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  //end of describe GET /api/recipes
  });


  describe('POST /api/recipes', () => {

    it('should create and return a new recipe when provided valid fields', () => {
      const newRecipe = {
        ing: [
          'Store-bought pizza dough, thawed',
          'Tyson\'s Anytizers Boneless Hot Wings Chicken Bites or any boneless buffalo chicken wings',
          '1/2 cup shredded cheddar cheese',
          '1/4 cup blue cheese dressing',
          '1/4 cup ranch dressing',
          '1 beaten egg wash'
        ],
        title: 'New Recipe Title',
        desc: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick.',
        serving: '2',
        imgUrl: 'https://sweettootsco.files.wordpress.com/2018/12/calzone.jpg',
        prep: '10 min',
        cook: '20 min',
        directions: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick. '
      };
      let res;
      return chai.request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .then( (_res) => {
          res = _res;
          console.log('res.body',res.body);
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          return Recipe.findById(res.body.id);
        })
        .then(data => {
          // console.log('data:', data);
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.desc).to.equal(data.desc);
          expect(res.body.ing.length).to.equal(data.ing.length);
          expect(res.body.imgUrl).to.equal(data.imgUrl);
          expect(res.body.prep).to.equal(data.prep);
          expect(res.body.cook).to.equal(data.cook);
          expect(res.body.directions).to.equal(data.directions);
          expect(res.body.expanded).to.equal(data.expanded);
          expect(res.body.serving).to.equal(data.serving);
        });
    });

    it('should return an error when missing "title" field', () => {
      const newRecipe = {
        ing: [
          'Store-bought pizza dough, thawed',
          'Tyson\'s Anytizers Boneless Hot Wings Chicken Bites or any boneless buffalo chicken wings',
          '1/2 cup shredded cheddar cheese',
          '1/4 cup blue cheese dressing',
          '1/4 cup ranch dressing',
          '1 beaten egg wash'
        ],
        desc: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick.',
        serving: '2',
        imgUrl: 'https://sweettootsco.files.wordpress.com/2018/12/calzone.jpg',
        prep: '10 min',
        cook: '20 min',
        directions: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick. '
      };
      return chai.request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when missing "desc" field', () => {
      const newRecipe = {
        ing: [
          'Store-bought pizza dough, thawed',
          'Tyson\'s Anytizers Boneless Hot Wings Chicken Bites or any boneless buffalo chicken wings',
          '1/2 cup shredded cheddar cheese',
          '1/4 cup blue cheese dressing',
          '1/4 cup ranch dressing',
          '1 beaten egg wash'
        ],
        title: 'New Recipe Title',
        serving: '2',
        imgUrl: 'https://sweettootsco.files.wordpress.com/2018/12/calzone.jpg',
        prep: '10 min',
        cook: '20 min',
        directions: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick. '
      };
      return chai.request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `description` in request body');
        });
    });

    it('should return an error when "title" is empty string', () => {
      const newRecipe = { title: '' };
      return chai.request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should catch errors and respond properly', () => {
      sandbox.stub(Recipe.schema.options.toJSON, 'transform').throws('FakeError');

      const newRecipe = {
        ing: [
          'Store-bought pizza dough, thawed',
          'Tyson\'s Anytizers Boneless Hot Wings Chicken Bites or any boneless buffalo chicken wings',
          '1/2 cup shredded cheddar cheese',
          '1/4 cup blue cheese dressing',
          '1/4 cup ranch dressing',
          '1 beaten egg wash'
        ],
        title: 'New Recipe Title',
        desc: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick.',
        serving: '2',
        imgUrl: 'https://sweettootsco.files.wordpress.com/2018/12/calzone.jpg',
        prep: '10 min',
        cook: '20 min',
        directions: 'Bacon ipsum dolor amet pancetta venison t-bone porchetta bresaola tail picanha, prosciutto corned beef drumstick. '
      };

      return chai.request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  //end of recipes POST test
  });


//end of test
});
