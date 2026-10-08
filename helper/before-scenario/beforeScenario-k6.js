import settingService from '../services/settingService.js';

class BeforeScenario {
 async enableHttps() {
  try {
    await settingService.enableHttps()
  } catch (error) {
    throw error;
  }
 }

 async enablePrefork() {
  try {
    await settingService.enablePrefork()
  } catch (error) {
    throw error;
  }
 }

 async enableHttp2() {
  try {
    await settingService.enableHttp2()
  } catch (error) {
    throw error;
    
  }
 }

 
}

export default new BeforeScenario();
