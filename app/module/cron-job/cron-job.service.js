const mssql = require('../../models/mssql/mssql_connection_pool');
const logger = require('../../common/classes/logger.class');
const apiHelper = require('../../common/helpers/api.helper');
const moduleClass = require('./cron-job.class');
const ServiceResponse = require('../../common/responses/service.response');
const { CronJobRegistry } = require('../../job');

const getList = async (queryParams = {}) => {
  try {
    const currentPage = apiHelper.getCurrentPage(queryParams);
    const itemsPerPage = apiHelper.getItemsPerPage(queryParams);
    const pool = await mssql.pool;

    const data = await pool
      .request()
      .input('PAGESIZE', itemsPerPage)
      .input('PAGEINDEX', currentPage)
      .execute('SYS_CRONJOB_GetList_AdminWeb');

    const list = moduleClass.list(data.recordset);

    list.forEach((cronjob) => {
      cronjob.cron_job_detail_list = cronjob.cron_job_detail_list ? JSON.parse(cronjob.cron_job_detail_list) : [];
    });

    return new ServiceResponse(true, '', {
      data: list,
      page: currentPage,
      limit: itemsPerPage,
      total: apiHelper.getTotalData(data.recordset),
    });
  } catch (e) {
    logger.error(e, { function: 'CronJobService.getList' });
    return new ServiceResponse(true, '', []);
  }
};

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

const updateStatusJob = async (bodyParams = {}) => {
  try {
    // stop job
    if (bodyParams.status) {
      CronJobRegistry.start(bodyParams.job_id);
    } else {
      CronJobRegistry.stop(bodyParams.job_id);
    }

    const pool = await mssql.pool;

    const result = await pool
      .request()
      .input('JOBID', apiHelper.getValueFromObject(bodyParams, 'job_id'))
      .input('JOBSTATUS', apiHelper.getValueFromObject(bodyParams, 'status') ? 1 : 0)
      .execute('SYS_CRONJOB_UpdateStatus_AdminWeb');

    return result?.recordset?.[0]?.RESULT;
  } catch (e) {
    logger.error(`cronJobService.updateStatusJob: ${e.message}`);
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
  updateStatusJob,
  createJob,
  createJobDetail,
  clearJob,
  getList,
};
