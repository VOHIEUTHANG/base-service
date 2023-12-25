const cron = require('node-cron'); //document: https://www.npmjs.com/package/node-cron
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const logger = require('../common/classes/logger.class');
const CronJobService = require('./job.service');

const ASIA_HCM_TIMEZONE = 'Asia/Ho_Chi_Minh';
const CRONJOB_STATUS = {
  SUCCESS: 1,
  FAILED: 0,
};

// Schedule structure: # * * * * * * : giây(O), phút(M), giờ(M), ngày trong tháng(M), tháng(M), ngày trong tuần(M)

class CronJob {
  constructor(jobId, schedule, executor, jobName, desciption, timeZone = ASIA_HCM_TIMEZONE) {
    try {
      this.jobId = jobId;
      this.schedule = schedule;
      this.name = jobName;
      this.desciption = desciption;
      this.isValid = cron.validate(schedule);
      this.job = cron.schedule(
        schedule,
        async () => {
          try {
            await executor();
            await CronJobService.createJobDetail({
              job_id: jobId,
              job_status: CRONJOB_STATUS.SUCCESS,
              created_date: moment().utc(new Date()).toDate(),
            });
          } catch (error) {
            logger.error(`Cronjob file: ${error?.message}`);
            await CronJobService.createJobDetail({
              job_id: jobId,
              job_status: CRONJOB_STATUS.FAILED,
              error_message: error.message,
              created_date: moment().utc(new Date()).toDate(),
            });
          }
        },
        { timezone: timeZone, scheduled: false },
      );
    } catch (error) {
      logger.error(`Cronjob file: ${error?.message}`);
    }
  }
  start() {
    this.job.start();
  }
  stop() {
    this.job.stop();
  }
}

class CronJobRegistry {
  constructor(jobList) {
    this.jobList = jobList;
  }
  async run() {
    // clear all saved jobs before start server
    await CronJobService.clearJob();
    try {
      // save list cronjob into database
      for (let job of this.jobList) {
        await CronJobService.createJob({
          job_id: job.jobId,
          job_name: job.name,
          job_schedule: job.schedule,
          job_description: job.desciption,
          job_status: job.isValid ? 1 : 0,
          is_valid: job.isValid ? 1 : 0,
        });
      }
      this.jobList.filter((job) => job.isValid).forEach((job) => job.start());
    } catch (error) {
      logger.error(`Cronjob file: ${error?.message}`);
    }
  }
  stop(jobId) {
    const job = this.jobList.find((job) => {
      return job.jobId === jobId;
    });
    job?.stop();
  }
  start(jobId) {
    const job = this.jobList.find((job) => job.jobId === jobId);
    job?.start();
  }
}

const Jobs = [
  new CronJob(
    uuidv4(),
    '00,10,20,30,40,50 * * * * *',
    () => {
      console.log('will execute every 10 seconds until stopped ', moment().format('DD/MM/YYY HH:mm:ss'));
    },
    'Cron job every 10 seconds',
    'This job doing something ...',
  ),
  new CronJob(
    uuidv4(),
    '* * * * *',
    async () => {
      console.log('will execute every minute until stopped ', moment().format('DD/MM/YYY HH:mm:ss'));
      throw new Error('Something error');
    },
    'Cron job every minute',
    'This job doing something ...',
  ),
];

const Registry = new CronJobRegistry(Jobs);

Registry.run();

module.exports = {
  CronJobRegistry: Registry,
};
