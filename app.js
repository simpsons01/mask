require('dotenv').config()
const express = require('express');
const app = express()
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render(path.resolve(__dirname + '/index.ejs'),{api_key:process.env.api_key})
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});