import setting from '../models/settingModel'
import getPublicIP from './getPublicIpService';
import 'dotenv/config';

class SettingService {
  async enableCors() {
    try {
      console.log('Enabling CORS...');
      await setting.updateCors(true);
    } catch (error) {
      console.log(error);
    }
  }

  async disableCors() {
    try {
      console.log('Disabling CORS...');
      await setting.updateCors(false);
    } catch (error) {
      console.log(error);
    }
  }

  async enableSecurityHeader() {
    try {
      console.log('Enabling Security Header...');
      await setting.updateSecurityHeader(true);
    } catch (error) {
      console.log(error);
    }
  }

  async disableSecurityHeader() {
    try {
      console.log("Disabling Security Header...");
      
      await setting.updateSecurityHeader(false);
    } catch (error) {
      console.log(error);
    }
  }

  async addIpBlackList() {
    let ip = await getPublicIP()
    try {
      console.log('Add IP to Blacklist...');
      await setting.addBlacklistIp(ip, 'for testing');
    } catch (error) {
      console.log(error);
    }
  }
}

export default SettingService();
