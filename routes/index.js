const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const Members = require('../models/membersModel');
const Comments = require('../models/commentsModel');

router.get('/', async (req, res, next) => {
  try {
    const comments = await Comments.find().populate('user');
    res.render('layout', { comments });
  } catch (err) {
    next(err);
  }
});

router.get('/joinmembers', (req, res) => res.render('joinmembers'));
router.post('/joinmembers', async (req, res) => {
  if (req.body.secret === 'cats') {
    await Members.updateOne({ username: req.user.username }, { $set: { member: true } });
  }
  res.redirect('/joinmembers');
});

router.get('/messageform', (req, res) => res.render('messageform'));
router.post('/messageform', async (req, res, next) => {
  try {
    const comment = new Comments({
      user: req.user._id,
      title: req.body.title,
      comment: req.body.comment,
      timestamp: Date.now(),
    });
    await comment.save();
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

router.get('/sign-up', (req, res) => res.render('sign-up'));
router.post('/sign-up', (req, res, next) => {
  bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {
    if (err) {
      return next(err);
    }
    const members = new Members({
      username: req.body.username,
      password: hashedPassword,
    }).save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });
});

router.get('/sign-in', (req, res) => res.render('sign-in'));

router.post(
  '/sign-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/sign-in',
  })
);

router.get('/log-out', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

module.exports = router;
