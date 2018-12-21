'use strict';

const express = require('express');
const app = express();

//pulling from server/public/index.html this is a test
app.use(express.static('public'));
app.listen(process.env.PORT || 8080);
