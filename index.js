var express = require('express')
var app = express()

var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/api')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function(){})

var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')
var ok = require('okay')
var enumRoles = ['user', 'admin', 'staff']
var positiveNum = function(value){
  if (value<0) {
    return false
  } else {
    return true
  }
}

// Post Model
var postSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    match: /^([\w ,.!?]{1,100})$/,
    set: function(value){
      return value.toUpperCase()
    },
    get: function(value){
      return value.toLowerCase()
    }
  },
  text: {
    type: String,
    required: true,
    max: 2000
  },
  followers: [mongoose.Schema.Types.ObjectId],
  meta: mongoose.Schema.Types.Mixed,
  comments: [{
    text: {
      type: String,
      trim: true,
      max: 2000
    },
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: {
        type: String,
        enum: enumRoles
      }
    }
  }],
  viewCounter: {
    type: Number
  },
  published: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
})

postSchema.path('viewCounter').validate(positiveNum)
var Post = mongoose.model('Post', postSchema, 'posts')

// Routes
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', function(req, res){
  res.send('ok')
})

app.get('/posts', function(req, res, next){
  Post.find({}, ok(next, function(posts){
    res.send(posts)
  }))
})

app.post('/posts', function(req, res, next){
  var post = new Post(req.body)
  post.validate(ok(next, function(){
    post.save(ok(next, function(results){
      res.send(results)
    }))
  }))
})

app.get('/posts/:id', function(req, res, next){
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    res.send(post.toJSON({getters: true}))
  }))
})

app.put('/posts/:id', function(req, res, next){
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    post.set(req.body)
    post.save(ok(next, function(post){
      res.send(post.toJSON({getters: true}))
    }))
  }))
})

app.delete('/posts/:id', function(req, res, next){
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    post.remove(ok(next, function(results){
      res.send(results)
    }))
  }))
})

app.use(errorHandler())

var server = require('http').createServer(app).listen(3000)
