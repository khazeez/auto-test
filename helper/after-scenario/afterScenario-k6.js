import settingService from '../services/settingService.js';

class BeforeScenario {
 async disableHttps() {
  try {
    await settingService.disableHttps()
  } catch (error) {
    throw error;
  }
 }

 async disablePrefork() {
  try {
    await settingService.disablePrefork()
  } catch (error) {
    throw error;
  }
 }

 async disableHttp2() {
  try {
    await settingService.disableHttp2()
  } catch (error) {
    throw error;
    
  }
 }

 
}

export default new BeforeScenario();
