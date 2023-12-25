const mssql = require('../models/mssql/mssql_connection_pool');
const logger = require('../common/classes/logger.class');
const apiHelper = require('../common/helpers/api.helper');

const createJob = async (bodyParams = {}) => {
  try {
    const pool = await mssql.pool;
    const result = await pool
      .request()
      .input('JOBID', apiHelper.getValueFromObject(bodyParams, 'job_id'))
      .input('JOBNAME', apiHelper.getValueFromObject(bodyParams, 'job_name'))
      .input('JOBSCHEDULE', apiHelper.getValueFromObject(bodyParams, 'job_schedule'))
      .input('JOBDESCRIPTION', apiHelper.getValueFromObject(bodyParams, 'job_description'))
      .input('JOBSTATUS', apiHelper.getValueFromObject(bodyParams, 'job_status'))
      .input('ISVALID', apiHelper.getValueFromObject(bodyParams, 'is_valid'))
      .execute('SYS_CRONJOB_CreateOrUpdate_AdminWeb');

    return result?.recordset?.[0]?.RESULT;
  } catch (e) {
    logger.error(`cronJobService.createJob: ${e.message}`);
    return null;
  }
};

const createJobDetail = async (bodyParams = {}) => {
  try {
    const pool = await mssql.pool;
    const result = await pool
      .request()
      .input('JOBID', apiHelper.getValueFromObject(bodyParams, 'job_id'))
      .input('JOBSTATUS', apiHelper.getValueFromObject(bodyParams, 'job_status'))
      .input('ERRORMESSAGE', apiHelper.getValueFromObject(bodyParams, 'error_message'))
      .input('CREATEDDATE', apiHelper.getValueFromObject(bodyParams, 'created_date'))
      .execute('SYS_CRONJOBDETAIL_CreateOrUpdate_AdminWeb');

    return result?.recordset?.[0]?.RESULT;
  } catch (e) {
    logger.error(`cronJobService.createJobDetail: ${e.message}`);
    return null;
  }
};

const clearJob = async () => {
  try {
    const pool = await mssql.pool;
    await pool.request().execute('SYS_CRONJOBDETAIL_ClearJob_AdminWeb');
  } catch (e) {
    logger.error(`cronJobService.clearJob: ${e.message}`);
  }
};

module.exports = {
  createJob,
  createJobDetail,
  clearJob,
};
