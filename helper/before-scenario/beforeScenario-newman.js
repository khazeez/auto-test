import settingService from '../services/settingService.js';

class BeforeScenario {
  async setIpBlock() {
    try {
      await settingService.addIpBlackList();
    } catch (error) {
      throw error;
    }
  }

  async setCorsOn() {
    try {
      await settingService.enableCors();
    } catch (error) {
      throw error;
    }
  }

  

  async setSecurityHeaderOn() {
    try {
      await settingService.enableSecurityHeader();
    } catch (error) {
      throw error;
    }
  }

 
}

export default new BeforeScenario();
