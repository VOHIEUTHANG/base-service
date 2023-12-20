const cron = require('node-cron');
const BULLMQQUEUE = require('../bullmq/queue');

const PreOrderService = require('../module/pre-order/pre-order.service');

// chạy job lên lịch gửi sms nhắc nhở thanh toán vào cuối ngày
cron
  .schedule(
    '55 23 * * *',
    async () => {
      try {
        await PreOrderService.getListAndUpdateJobs();
      } catch (error) {
        logger.error(error);
      }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh',
    },
  )
  .start();
