const Transform = require('../../common/helpers/transform.helper');

const template = {
  job_id: '{{#? JOBID }}',
  job_name: '{{#? JOBNAME }}',
  job_description: '{{#? JOBDESCRIPTION}}',
  job_schedule: '{{#? JOBSCHEDULE}}',
  job_status: '{{#? JOBSTATUS}}',
  is_valid: '{{#? ISVALID}}',
  created_date: '{{#? CREATEDDATE}}',
  cron_job_detail_list: '{{#? CRONJOBDETAILLIST}}',
};

let transform = new Transform(template);

const detail = (obj) => {
  return transform.transform(obj, [
    'job_id',
    'job_name',
    'job_description',
    'job_schedule',
    'job_status',
    'is_valid',
    'created_date',
  ]);
};

const list = (list = []) => {
  return transform.transform(list, [
    'job_id',
    'job_name',
    'job_description',
    'job_schedule',
    'job_status',
    'is_valid',
    'created_date',
    'cron_job_detail_list',
  ]);
};

module.exports = {
  detail,
  list,
};
