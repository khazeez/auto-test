import settingModel from '../models/settingModel.js';
import getPublicIP from './getPublicIpService.js';
import 'dotenv/config';

class SettingService {
  async enableCors() {
    try {
      console.log('Enabling CORS...');
      await settingModel.updateCors(true);
    } catch (error) {
      throw error;
    }
  }

  async disableCors() {
    try {
      console.log('Disabling CORS...');
      await settingModel.updateCors(false);
    } catch (error) {
      throw error;
    }
  }

  async enableSecurityHeader() {
    try {
      console.log('Enabling Security Header...');
      await settingModel.updateSecurityHeader(true);
    } catch (error) {
      throw error;
    }
  }

  async disableSecurityHeader() {
    try {
      console.log('Disabling Security Header...');

      await settingModel.updateSecurityHeader(false);
    } catch (error) {
      throw error;
    }
  }

  async addIpBlackList() {
    let ip = await getPublicIP();
    try {
      console.log('Add IP to Blacklist...');
      await settingModel.addBlacklistIp(ip, 'for testing');
    } catch (error) {
      throw error;
    }
  }

  async removeIpBlackList() {
    let ip = await getPublicIP();
    try {
      await settingModel.removeBlacklistIp(ip);
    } catch (error) {
      throw error;
    }
  }

  async enableHttps() {
    try {
      await settingModel.updateHttps(true)
    } catch (error) {
      throw error;  
    } 
  }

  async disableHttps() {
    try {
      await settingModel.updateHttps(false)
    } catch (error) {
      throw error;
    }
  }

  async enablePrefork() {
    try {
      await settingModel.updatePrefork(true)
    } catch (error) {
      throw error; 
    }
  }

  async disablePrefork() {
    try {
      await settingModel.updatePrefork(false)
    } catch (error) {
      throw error; 
    }
  }


  async enableHttp2() {
    try {
      await settingModel.updateHttp2(true)
    } catch (error) {
      throw error; 
    }
  }

  async disableHttp2() {
    try {
      await settingModel.updateHttp2(false)
    } catch (error) {
      throw error;
    }
  }
}

export default new SettingService();
