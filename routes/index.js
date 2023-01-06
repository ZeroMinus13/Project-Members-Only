const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const Members = require('../models/membersModel');
const Comments = require('../models/commentsModel');
const { body, validationResult, check } = require('express-validator');

router.get('/', async (req, res, next) => {
  try {
    const comments = await Comments.find().populate('user');
    return res.render('layout', { comments, user: req.user });
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
router.post('/sign-up', [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .not()
    .isEmpty()
    .trim()
    .escape(),

  body('password')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters long')
    .matches(/\d/)
    .withMessage('Must contain a number')
    .not()
    .isEmpty()
    .trim()
    .escape(),

  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation is incorrect');
    }
    return true;
  }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const usernameError = errors.array().find((error) => error.param === 'username');
      const passwordError = errors.array().find((error) => error.param === 'password');
      const confirmPassError = errors.array().find((error) => error.param === 'confirmPassword');
      return res.render('sign-up', { usernameError, passwordError, confirmPassError });
    }
    try {
      const findUser = await Members.find({ username: req.body.username });
      if (findUser.length > 0)
        return res.render('sign-up', { usernameError: 'User already exists' });
      bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {
        if (err) {
          return next(err);
        }
        let usernameDB = req.body.username.toLowerCase();
        const members = new Members({
          username: usernameDB,
          password: hashedPassword,
        }).save((err) => {
          if (err) {
            return next(err);
          }
          res.redirect('/');
        });
      });
    } catch (err) {
      next(err);
    }
  },
]);

router.get('/sign-in', (req, res) => res.render('sign-in'));

router.post(
  '/sign-in',
  [
    check('username')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long'),
    check('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 characters long')
      .matches(/\d/)
      .withMessage('Must contain a number'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const usernameError = errors.array().find((error) => error.param === 'username');
      const passwordError = errors.array().find((error) => error.param === 'password');
      return res.render('sign-in', { usernameError, passwordError });
    }
    next();
  },
  passport.authenticate('local', {
    successRedirect: '/messageform',
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
