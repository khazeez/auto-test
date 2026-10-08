import settingService from '../services/settingService.js';

class AfterScenario {
  async setCorsOff() {
    try {
      await settingService.disableCors();
    } catch (error) {
      throw error;
    }
  }

  async setSecurityHeaderOff() {
    try {
      await settingService.disableSecurityHeader();
    } catch (error) {
      throw error;
    }
  }

  async removeIpFromBlackList() {
    try {
      await settingService.removeIpBlackList();
    } catch (error) {
      throw error;
    }
  }
}

export default new AfterScenario();
