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
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

var userSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  role: {
    type: String,
    enum: enumRoles
  }
})

postSchema.path('viewCounter').validate(positiveNum)
postSchema.virtual('hasComments').get(function(){
  return this.comments.length>0
})
postSchema.pre('save', function(next){
  this.updatedAt = new Date()
  next()
})
postSchema.pre('validate', function(next){
  var error = null
  if (this.isModified('comments') && this.comments.length > 0) {
    this.comments.forEach(function(value, key, list){
      if (!value.text || !value.author.id) {
        error = new Error('Text and author for a comment must be set')
      }
    })
  }
  if (error) return next(error)
  next()
})
postSchema.post('save', function(document){
  console.log('Object was saved!')
})
postSchema.statics.staticMethod = function(callback){
  console.log('static method')
  return callback()
}
postSchema.methods.myMethod = function(callback){
  console.log('my method')
  return callback()
}

var Post = mongoose.model('Post', postSchema, 'posts')
var User = mongoose.model('User', userSchema, 'users')

// Routes
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', function(req, res){
  Post.staticMethod(function(){
    res.send('ok')
  })
})

app.get('/posts', function(req, res, next){
  Post.find({}, 'id title', ok(next, function(posts){
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
  Post.findOne({_id: req.params.id}).populate('author').exec(ok(next, function(post){
    post.myMethod(function(){})
    res.send(post.toJSON({getters: true, virtuals: true}))
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

app.post('/users', function(req, res, next){
  var user = new User(req.body)
  user.save(ok(next, function(results){
    res.send(results)
  }))
})

app.use(errorHandler())

var server = require('http').createServer(app).listen(3000)
