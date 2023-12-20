const bullmqHelper = require('../common/helpers/bullmq.helper');
const BULLMQCONST = require('../common/const/bullmq.const');
// Jobs
const notification = require('./jobs/notification.job');
const email = require('./jobs/email.job');

const process = async (data = {}) => {
  const { type, payload } = data;
  if (!type || !payload) return;
  const jobType = bullmqHelper.getJobType(type);

  if (!jobType) return;
  switch (jobType) {
    case BULLMQCONST.JOB.NOTIFICATION:
      return notification.process(type, payload);
    case BULLMQCONST.JOB.EMAIL:
      return email.process(type, payload);
    default:
  }
  return;
};

module.exports = {
  process,
};
