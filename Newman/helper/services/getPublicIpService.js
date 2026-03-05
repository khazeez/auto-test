import axios from 'axios';

export default async function getPublicIP() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json');
    return res.data.ip;
  } catch (error) {
    console.log(error);
  }
}
