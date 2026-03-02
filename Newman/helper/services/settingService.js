const setting = require('../models/settingModel.js')
require('dotenv').config();

class SettingService {
  async enableCors() {
    try {
      await setting.updateCors(true);
    } catch (error) {
      console.log(error);
    }
  }

  async disableCors() {
    try {
      await setting.updateCors(false);
    } catch (error) {
      console.log(error);
    }
  }

  async enableSecurityHeader() {
    try {
      await setting.updateSecurityHeader(true);
    } catch (error) {
      console.log(error);
    }
  }

  async disableSecurityHeader() {
    try {
      await setting.updateSecurityHeader(false);
    } catch (error) {
      console.log(error);
    }
  }

  async addIpBlackList() {
    let ip = process.env.IP_ADDRESS;
    try {
      await setting.addBlacklistIp(ip, 'for testing');
    } catch (error) {
      console.log(error);
    }
  }
}

export default SettingService();
