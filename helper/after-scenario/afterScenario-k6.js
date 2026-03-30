import settingService from '../services/settingService.js';

class BeforeScenario {
 async disableHttps() {
  try {
    await settingService.disableHttps()
  } catch (error) {
    console.log(error);
  }
 }

 async disablePrefork() {
  try {
    await settingService.disablePrefork()
  } catch (error) {
    console.log(error);
  }
 }

 async disableHttp2() {
  try {
    await settingService.disableHttp2()
  } catch (error) {
    console.log(error);
    
  }
 }

 
}

export default new BeforeScenario();
