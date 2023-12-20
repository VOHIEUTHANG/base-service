const mailService = require('./mail.service');
const SingleResponse = require('../../common/responses/single.response');
const fcmService = require('../../bullmq/jobs/notification.job');
const fcmKeyNavigate = require('../../common/const/fcm.const');

const pushNotification = async (req, res, next) => {
  try {
    const listDepartments = (req.body?.list_department || []).map((item) => item || '')?.join('|');
    const listUsernames = (req.body?.list_user || []).map((item) => item || '')?.join('|');
    const getListTokenUserRes = await mailService.getListTokenDeviceUser(listUsernames || '', listDepartments || '');
    if (getListTokenUserRes.data?.data && getListTokenUserRes.data?.data?.length > 0) {
      let imageUrl = '';
      // if (req.body?.content && req.body?.content?.includes('<img')) {
      //   const regex = /<img[^>]+src="?([^"\s]+)"?[^>]*\>/g;
      //   imageUrl = regex.exec(req.body?.content || '')?.[1];
      // }
      const imageNotif = imageUrl ? { imageUrl } : {};

      fcmService.process('notification.pushToMulticast', {
        notification: {
          notification: {
            title: req.body?.mail_subject || 'Tin nhắn mới',
            body: req.body?.mail_content || '',
          },
          data: {
            key: fcmKeyNavigate.internalMail,
            id: req.body?.mail_id || '',
          },
          android: { notification: { ...imageNotif, sound: 'default' } },
          apns: {
            payload: { aps: { 'mutable-content': 1, sound: 'default' } },
            fcm_options: { image: imageUrl },
          },
          webpush: { headers: { image: imageUrl } },
        },
        registrationTokens: getListTokenUserRes.data.data,
      });
    }

    return res.json(new SingleResponse(getListTokenUserRes.getData()));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  pushNotification,
};
