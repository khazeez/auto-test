import settingModel from '../models/settingModel.js';
import getPublicIP from './getPublicIpService.js';
import 'dotenv/config';

class SettingService {
  async enableCors() {
    try {
      console.log('Enabling CORS...');
      await settingModel.updateCors(true);
    } catch (error) {
      console.log(error);
    }
  }

  async disableCors() {
    try {
      console.log('Disabling CORS...');
      await settingModel.updateCors(false);
    } catch (error) {
      console.log(error);
    }
  }

  async enableSecurityHeader() {
    try {
      console.log('Enabling Security Header...');
      await settingModel.updateSecurityHeader(true);
    } catch (error) {
      console.log(error);
    }
  }

  async disableSecurityHeader() {
    try {
      console.log('Disabling Security Header...');

      await settingModel.updateSecurityHeader(false);
    } catch (error) {
      console.log(error);
    }
  }

  async addIpBlackList() {
    let ip = await getPublicIP();
    try {
      console.log('Add IP to Blacklist...');
      await settingModel.addBlacklistIp(ip, 'for testing');
    } catch (error) {
      console.log(error);
    }
  }

  async removeIpBlackList() {
    let ip = await getPublicIP();
    try {
      await settingModel.removeBlacklistIp(ip);
    } catch (error) {
      console.log(error);
    }
  }
}

export default new SettingService();
