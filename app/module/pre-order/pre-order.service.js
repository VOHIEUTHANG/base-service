const sql = require('mssql');
const moment = require('moment');
const cron = require('node-cron');
const ServiceResponse = require('../../common/responses/service.response');
const logger = require('../../common/classes/logger.class');
const mssql = require('../../models/mssql/mssql_connection_pool');
const apiHelper = require('../../common/helpers/api.helper');
const BULLMQQUEUE = require('../../bullmq/queue');
const preOrderClass = require('./pre-order.class');

const CRON_JOBS_PRE_ORDER = {};

const destroyCronJob = (cronName) => {
  try {
    if (CRON_JOBS_PRE_ORDER[cronName]) {
      CRON_JOBS_PRE_ORDER[cronName].stop();
      delete CRON_JOBS_PRE_ORDER[cronName];
    }
  } catch (error) {
    logger.error(error, { function: 'preOrderService.stopCronJob' });
  }
};

const runTaskSendSMS = async ({ cronName, preOrderData }) => {
  try {
    BULLMQQUEUE.add({ type: 'pre-order.sendSMS', payload: preOrderData });
    destroyCronJob(cronName);
  } catch (error) {
    logger.error(error, { function: 'preOrderService.updatePreOrderCronJob' });
  }
};

const updatePreOrderCronJob = ({ cronName, preOrderData, time }) => {
  try {
    destroyCronJob(cronName);
    if (!cron.validate(time)) {
      throw new Error('updatePreOrderCronJob: Invalid cron time');
    }
    CRON_JOBS_PRE_ORDER[cronName] = cron.schedule(
      time,
      () => {
        runTaskSendSMS({ cronName, preOrderData });
      },
      {
        timezone: 'Asia/Ho_Chi_Minh',
      },
    );
  } catch (error) {
    logger.error(error, { function: 'preOrderService.updatePreOrderCronJob' });
  }
};

/**
 * SMS sẽ được gửi vào lúc 8h sáng 3 ngày trước ngày hẹn nhân hàng
 */
const getListAndUpdateJobs = async () => {
  try {
    const pool = await mssql.pool;
    const data = await pool.request().execute('SL_PREORDER_GetListToScheduleSendSMS_AdminWeb');
    const listToScheduleSendSMS = preOrderClass.listToScheduleSendSMS(data.recordset);
    for (let i = 0; i < listToScheduleSendSMS.length; i++) {
      const sendItem = listToScheduleSendSMS[i];
      const [day, month] = sendItem.send_date.split('/').map(Number);
      updatePreOrderCronJob({
        cronName: `PRE_ORDER_${sendItem.pre_order_id}_${sendItem.order_id}`,
        preOrderData: sendItem,
        time: `0 0 8 ${day} ${month} *`,
        // time: '*/1 17 19 8 *',
      });
    }
  } catch (error) {
    logger.error(error, { function: 'PreOrderService.scheduleSendSmsPayment' });
    return new ServiceResponse(true, '', {});
  }
};

const PreOrderService = {
  getListAndUpdateJobs,
  updatePreOrderCronJob,
  destroyCronJob,
};

module.exports = PreOrderService;
