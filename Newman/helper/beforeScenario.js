import settingService from './services/settingService.js';

class BeforeScenario {
  async setIpBlock() {
    try {
      await settingService.addIpBlackList();
    } catch (error) {
      console.log(error);
    }
  }

  async setCorsOn() {
    try {
      await settingService.enableCors();
    } catch (error) {
      console.log(error);
    }
  }

  

  async setSecurityHeaderOn() {
    try {
      await settingService.enableSecurityHeader();
    } catch (error) {
      console.log(error);
    }
  }

 
}

export default new BeforeScenario();
