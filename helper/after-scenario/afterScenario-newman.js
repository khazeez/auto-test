import settingService from '../services/settingService.js';

class AfterScenario {
  async setCorsOff() {
    try {
      await settingService.disableCors();
    } catch (error) {
      console.log(error);
    }
  }

  async setSecurityHeaderOff() {
    try {
      await settingService.disableSecurityHeader();
    } catch (error) {
      console.log(error);
    }
  }

  async removeIpFromBlackList() {
    try {
      await settingService.removeIpBlackList();
    } catch (error) {
      console.log(error);
    }
  }
}

export default new AfterScenario();
