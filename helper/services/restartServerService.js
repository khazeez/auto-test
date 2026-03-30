import axios from 'axios';
import spinner from './spinnerService.js'


export default async function RestartService() {

  const loginSpinner = spinner('Login...');
  const responseAuth = await axios.post('http://202.72.206.162:3737/auth', {
    username: 'adminlawang',
    password: 'admin@1234567',
  });
  const token = responseAuth.data.token;
  loginSpinner.success('Login success');


  const restartSpinner = spinner('Restarting server...');
  const response = await axios.post(
    'http://202.72.206.162:3737/servers/e15dd283-e9f1-4c06-93cc-c5b5b2796d8e/restart',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Expect': '',
      },
    }
  );

  if (response.data.message === 'ok') {
    restartSpinner.success('Restart server success');
  } else {
    restartSpinner.fail('Restart server failed');
  }
}
