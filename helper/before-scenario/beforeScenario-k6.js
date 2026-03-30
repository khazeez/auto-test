import settingService from '../services/settingService.js';

class BeforeScenario {
 async enableHttps() {
  try {
    await settingService.enableHttps()
  } catch (error) {
    console.log(error);
  }
 }

 async enablePrefork() {
  try {
    await settingService.enablePrefork()
  } catch (error) {
    console.log(error);
  }
 }

 async enableHttp2() {
  try {
    await settingService.enableHttp2()
  } catch (error) {
    console.log(error);
    
  }
 }

 
}

export default new BeforeScenario();
