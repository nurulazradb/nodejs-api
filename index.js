var express = require('express')
var mongoose = require('mongoose')

var app = express()
var dbUri = 'mongodb://localhost:27017/api'
var dbConnection = mongoose.createConnection(dbUri)
var Schema = mongoose.Schema
var postSchema = new Schema ({
  title: String,
  text: String
})
var Post = dbConnection.model('Post', postSchema, 'posts')

app.get('/', function(req, res) {
  res.send('ok')
})

app.get('/posts', function(req, res) {
  Post.find({}, function(error, posts) {
    if (error) return next(error)
    res.send(posts)
  
  })
})
var server = require('http').createServer(app).listen(3000)
