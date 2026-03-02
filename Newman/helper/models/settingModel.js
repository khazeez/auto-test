const db = require('../config/db.js'); ;

class SettingModels {
  
  async updateCors(value) {
    return await db('server_settings')
      .where({
        id: '7bcfff88-94b2-40a6-ae53-4dd92792ff07',
      })
      .update({
        enable_cors: value,
      });
  }

  async updateSecurityHeader(value) {
    return await db('server_settings')
      .where({
        id: '7bcfff88-94b2-40a6-ae53-4dd92792ff07',
      })
      .update({
        enable_security_headers: value,
      });
  }

  async addBlacklistIp(ip, description) {
  
    const row = await db('blacklists')
      .where({ id: 'f2000f75-d697-40ae-bbef-e78001021e55' })
      .first();

    const current = JSON.parse(row.value ?? '[]');

    const updated = [...current, { ip, description }];

    const [result] = await db('blacklists')
      .where({ id: 'f2000f75-d697-40ae-bbef-e78001021e55' })
      .update({ value: JSON.stringify(updated) })
      .returning('*');

    return result;
  }
}

export default new SettingModels()
