import db from '../config/db.js'

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

  async addBlacklistIp(value, description) {
    const row = await db('blacklists')
      .where({ id: 'f2000f75-d697-40ae-bbef-e78001021e55' })
      .first();

    const current = JSON.parse(row.value ?? '[]');

    const updated = [...current, { value, description }];

    const [result] = await db('blacklists')
      .where({ id: 'f2000f75-d697-40ae-bbef-e78001021e55' })
      .update({ value: JSON.stringify(updated) })
      .returning('*');

    return result;
  }

  async removeBlacklistIp(ip) {
    const row = await db('blacklists')
      .where({ id: 'f2000f75-d697-40ae-bbef-e78001021e55' })
      .first();

    const current = JSON.parse(row.value ?? '[]');

    const updated = current.filter((entry) => entry.value !== ip);

    const [result] = await db('blacklists')
      .where({ id: 'f2000f75-d697-40ae-bbef-e78001021e55' })
      .update({ value: JSON.stringify(updated) })
      .returning('*');

    return result;
  }
}

export default new SettingModels()
