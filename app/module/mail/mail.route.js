const express = require('express');
const mailController = require('./mail.controller');
const routes = express.Router();
const prefix = '/mail';

routes.route('').post(mailController.pushNotification);

module.exports = {
  prefix,
  routes,
};
