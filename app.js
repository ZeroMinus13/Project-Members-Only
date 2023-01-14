require('dotenv').config();
const express = require('express');
const path = require('path');
const usersRouter = require('./routes/index');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Members = require('./models/membersModel');

const mongoDb = process.env.mongodb;
mongoose.set('strictQuery', false);
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.cookie,
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + 86400000),
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy((username, password, done) => {
    Members.findOne({ username }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect password' });
        }
      });
    });
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Members.findById(id, function (err, user) {
    done(err, user);
  });
});

function addUser(req, res, next) {
  res.locals.user = req.user;
  next();
}
app.use(addUser);
app.use('/', usersRouter);

app.use(function (err, req, res, next) {
  res.render('error');
});

app.listen(process.env.PORT || 3000), () => console.log('app listening on port 3000!'));
