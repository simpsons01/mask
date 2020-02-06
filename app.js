require('dotenv-safe').config();
const express = require('express');
const app = express()
const path = require('path')

app.get('/', function (req, res) {
    res.render(path.resolve(__dirname + '/index.ejs'),{api:process.env.api_key})
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});