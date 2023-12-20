const { Queue, QueueScheduler } = require('bullmq');
const config = require('../../config/config');
const logger = require('../common/classes/logger.class');

const queue = new Queue(config.BULLMQ.QUEUE, { connection: config.redis });

const add = (data, opts = {}) => {
  const _opts = Object.assign({}, opts, { removeOnComplete: true, removeOnFail: true });
  queue.add(config.BULLMQ.QUEUE, data, _opts);
};

const addIfNotExists = async ({ type, payload, jobId }) => {
  try {
    const existingJob = await queue.getJob(jobId);
    if (!existingJob) {
      console.log('addingJob', jobId)
      queue.add(config.BULLMQ.QUEUE, { type, payload }, { jobId });
    } else{
      console.log('existingJob', jobId)
    }
  } catch (error) {
    console.log('~ addIfNotExists error >>>', error.message)
  }
};

module.exports = {
  queue,
  add,
  addIfNotExists,
};
