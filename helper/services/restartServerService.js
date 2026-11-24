import axios from 'axios';
import spinner from './spinnerService.js'
import 'dotenv/config';


export default async function RestartService() {

  let env = process.env

  const loginSpinner = spinner('Login...');
  const responseAuth = await axios.post(`${env.CONSOLE_URL}/auth`, {
    username: 'adminlawang',
    password: 'admin@1234567',
  });
  const token = responseAuth.data.token;
  loginSpinner.success('Login success');


  const restartSpinner = spinner('Restarting server...');
  const response = await axios.post(
    `${env.CONSOLE_URL}/servers/${env.SERVER_CORE_ID}/restart`,
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


  const waitSec = Number(env.RESTART_WAIT_SECONDS ?? 20);
  const waitSpinner = spinner(`Menunggu service naik (${waitSec}s)...`);
  await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
  waitSpinner.success('Service siap');
}
