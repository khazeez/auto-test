import axios from 'axios';
import spinner from './spinnerService.js'
import 'dotenv/config';


export default async function RestartService() {

  const loginSpinner = spinner('Login...');
  const responseAuth = await axios.post('https://console.moklaar.cloud/auth', {
    username: 'adminlawang',
    password: 'admin@1234567',
  });
  const token = responseAuth.data.token;
  loginSpinner.success('Login success');


  const restartSpinner = spinner('Restarting server...');
  const response = await axios.post(
    'https://console.moklaar.cloud/servers/e8f2533c-2a4f-4a2b-b87d-6a403883aadb/restart',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Expect': '',
      },
    }
  );

  if (response.data.message !== 'ok') {
    restartSpinner.fail('Restart server failed');
    throw new Error('Restart server failed');
  }
  restartSpinner.success('Restart server success');

  // beri waktu service naik lagi sebelum test dijalankan (atur lewat RESTART_WAIT_SECONDS di .env)
  const waitSec = Number(process.env.RESTART_WAIT_SECONDS ?? 20);
  const waitSpinner = spinner(`Menunggu service naik (${waitSec}s)...`);
  await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
  waitSpinner.success('Service siap');
}
