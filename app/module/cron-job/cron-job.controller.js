const httpStatus = require('http-status');
const SingleResponse = require('../../common/responses/single.response');
const ListResponse = require('../../common/responses/list.response');
const ErrorResponse = require('../../common/responses/error.response');
const RESPONSE_MSG = require('../../common/const/responseMsg.const');

const service = require('./cron-job.service');

const getList = async (req, res, next) => {
  try {
    const serviceRes = await service.getList(req.query);
    if (serviceRes.isFailed()) {
      return next(serviceRes);
    }
    const { data, total, page, limit } = serviceRes.getData();
    return res.json(new ListResponse(data, total, page, limit));
  } catch (error) {
    return next(new ErrorResponse(httpStatus.NOT_IMPLEMENTED, error, RESPONSE_MSG.REQUEST_FAILED));
  }
};

const update = async (req, res, next) => {
  try {
    const serviceRes = await service.updateStatusJob(req.body);

    if (serviceRes) {
      return res.json(new SingleResponse(null, RESPONSE_MSG.REQUEST_SUCCESS));
    } else {
      return next(new ErrorResponse(httpStatus.NOT_IMPLEMENTED, 'failed', RESPONSE_MSG.REQUEST_FAILED));
    }
  } catch (error) {
    return next(new ErrorResponse(httpStatus.NOT_IMPLEMENTED, error, RESPONSE_MSG.REQUEST_FAILED));
  }
};

const detail = async (req, res, next) => {
  try {
    const serviceRes = await service.getDetail(req.params.cron_job_id);

    if (serviceRes.isFailed()) {
      return next(serviceRes);
    }

    return res.json(new SingleResponse(serviceRes.getData()));
  } catch (error) {
    return next(new ErrorResponse(httpStatus.NOT_IMPLEMENTED, error, RESPONSE_MSG.REQUEST_FAILED));
  }
};

module.exports = {
  getList,
  update,
  detail,
};
