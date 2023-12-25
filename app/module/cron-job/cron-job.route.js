const express = require('express');
const validate = require('express-validation');
const controller = require('./cron-job.controller');
const routes = express.Router();

const prefix = '/cron-job';

routes.route('').get(controller.getList).put(controller.update);

routes.route('/:cron_job_id(\\d+)').get(controller.detail);

module.exports = {
  prefix,
  routes,
};
