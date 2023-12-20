const qs = require('qs');
const axios = require('axios');
const logger = require('../classes/logger.class');
const mssql = require('../../models/mssql/mssql_connection_pool');
const config = require('../../../config/config');
const apiHelper = require('../helpers/api.helper');

const ENDPOINT = {
  OPEN_API: 'https://openapi.zalo.me',
  AUTH: 'https://oauth.zaloapp.com/v4',
};

class Zalo {
  _appId = config.zalo.appId;
  _appSecret = config.zalo.appSecret;
  isRefreshingToken = false;
  tokenRefreshPromise = null;

  constructor() {
    this.auth = axios.create({
      baseURL: ENDPOINT.AUTH,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
    this.auth.interceptors.response.use(
      (response) => {
        if (response?.data?.error) {
          logger.error('Lỗi Zalo API response', response.data);
          throw new Error(response.data.error_name);
        }
        return response;
      },
      (error) => {
        logger.error('Lỗi Zalo API error', error);
        throw new Error(error.message);
      },
    );
    this.api = axios.create({
      baseURL: ENDPOINT.OPEN_API,
      headers: {
        'content-type': 'application/json',
      },
    });
    this.api.interceptors.request.use(
      async (config) => {
        const pool = await mssql.pool;
        const data = await pool.request().query('SELECT TOP 1 ACCESSTOKEN FROM MD_TOKENSOCIALNETWORK WHERE ISZALO = 1');
        if (data.recordset[0]?.ACCESSTOKEN) {
          config.headers.access_token = data.recordset[0].ACCESSTOKEN;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
    this.api.interceptors.response.use(
      async (response) => {
        if (response?.data?.error && response?.data?.error != 0) {
          const config = response.config;
          const { message } = response.data;
          if (message?.toLowerCase().includes('expired') || message?.toLowerCase().includes('invalid')) {
            return this.refreshTokenIfNeeded(config);
          }
          throw new Error(message);
        } else {
          return response.data;
        }
      },
      async (error) => {
        logger.error('Lỗi Zalo API', error);
        throw new Error(error.message);
      },
    );
  }

  async refreshTokenIfNeeded(config) {
    if (!this.isRefreshingToken) {
      this.isRefreshingToken = true;
      this.tokenRefreshPromise = this.loadAccessTokenByRefreshTokenPromise()
        .then((newAccessToken) => {
          this.isRefreshingToken = false;
          return newAccessToken;
        })
        .catch((error) => {
          this.isRefreshingToken = false;
          throw error;
        });
    }

    return this.tokenRefreshPromise.then((newAccessToken) => {
      if (newAccessToken) {
        config.headers.access_token = newAccessToken;
        return this.api(config);
      } else {
        throw new Error('Lỗi làm mới token');
      }
    });
  }

  async loadRefreshToken() {
    try {
      const pool = await mssql.pool;
      const data = await pool
        .request()
        .query('SELECT TOP 1 ACCESSTOKEN, REFRESHTOKEN FROM MD_TOKENSOCIALNETWORK WHERE ISZALO = 1');
      if (data.recordset[0]?.REFRESHTOKEN) {
        return data.recordset[0].REFRESHTOKEN;
      }
      throw new Error('Không tìm thấy REFRESHTOKEN');
    } catch (error) {
      logger.error('Lỗi Zalo API loadAccessTokenByRefreshToken', error.message);
      return '';
    }
  }

  async loadAccessTokenByRefreshToken() {
    let refresh_token = await this.loadRefreshToken();
    const oaRes = await this.auth({
      method: 'post',
      url: '/oa/access_token',
      headers: { secret_key: this._appSecret },
      data: qs.stringify({
        app_id: this._appId,
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });
    if (oaRes.data?.access_token) {
      const pool = await mssql.pool;
      await pool
        .request()
        .input('ACCESSTOKEN', apiHelper.getValueFromObject(oaRes.data, 'access_token'))
        .input('REFRESHTOKEN', apiHelper.getValueFromObject(oaRes.data, 'refresh_token'))
        .execute('MD_TOKEN_CreateOrUpdateZaloToken');
      return oaRes.data.access_token;
    } else {
      logger.error('Lỗi Zalo API loadAccessTokenByRefreshToken', oaRes.data);
      return false;
    }
  }

  async loadAccessTokenByRefreshTokenPromise() {
    return new Promise(async (resolve, reject) => {
      try {
        let refresh_token = await this.loadRefreshToken();
        const oaRes = await this.auth({
          method: 'post',
          url: '/oa/access_token',
          headers: { secret_key: this._appSecret },
          data: qs.stringify({
            app_id: this._appId,
            grant_type: 'refresh_token',
            refresh_token,
          }),
        });
        if (oaRes.data?.access_token) {
          const pool = await mssql.pool;
          await pool
            .request()
            .input('ACCESSTOKEN', apiHelper.getValueFromObject(oaRes.data, 'access_token'))
            .input('REFRESHTOKEN', apiHelper.getValueFromObject(oaRes.data, 'refresh_token'))
            .execute('MD_TOKEN_CreateOrUpdateZaloToken');
          resolve(oaRes.data.access_token);
        } else {
          logger.error('Lỗi Zalo API loadAccessTokenByRefreshToken', oaRes.data);
          reject(new Error('Lỗi Zalo API loadAccessTokenByRefreshToken'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async getInfo() {
    return await this.api({ method: 'GET', url: '/v2.0/oa/getoa' }).then((res) => res.data);
  }
  async sendTextMessage({ user_id, text_message, attachment_url }) {
    const sendPayload = {
      recipient: {
        user_id: user_id,
      },
      message: {
        text: text_message,
      },
    };
    if (attachment_url) {
      sendPayload.message.attachment = {
        type: 'template',
        payload: {
          template_type: 'media',
          elements: [
            {
              media_type: 'image',
              url: attachment_url,
            },
          ],
        },
      };
    }
    return await this.api({
      method: 'POST',
      url: '/v3.0/oa/message/cs',
      data: sendPayload,
    }).then((res) => res.data);
  }
  async sendZNS({ phone, template_id, template_data, mode }) {
    return await this.api({
      method: 'POST',
      baseURL: 'https://business.openapi.zalo.me',
      url: '/message/template',
      data: {
        phone,
        template_id,
        template_data,
        mode,
      },
    }).then((res) => res.data);
  }
  async getListTemplate() {
    return await this.api({
      method: 'GET',
      baseURL: 'https://business.openapi.zalo.me',
      url: '/template/all?offset=0&limit=100',
    }).then((res) => res.data);
  }
  async getTemplateById(template_id) {
    return await this.api({
      method: 'GET',
      baseURL: 'https://business.openapi.zalo.me',
      url: `/template/info?template_id=${template_id}`,
    }).then((res) => res.data);
  }
}

module.exports = new Zalo();
