import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, group, sleep } from 'k6';
import { Public, Private, User } from '../data/endpoints.js';

const env = JSON.parse(open('../env/Lawang-Core.environment.json'));
const { baseUrl, username, password } = env;

export function lawangScenario() {
  const auth = encoding.b64encode(`${username}:${password}`);

  group('Public', () => {
    for (const path of Public) {
      const res = http.get(`${baseUrl}${path}`);
      check(res, { [path]: r => r.status === 200 });
      sleep(1);
    }
  });

  group('Private', () => {
    
    for (const path of Private) {
      const res = http.get(`${baseUrl}${path}`, {  headers: {
          Authorization: `Basic ${auth}`,
        }, });
      check(res, { [path]: r => r.status === 200 });
      sleep(1);
    }
  });

  group('User', () => {
    for (const path of User) {
     const res = http.get(`${baseUrl}${path}`, {  headers: {
          Authorization: `Basic ${auth}`,
        }, });
      check(res, { [path]: r => r.status === 200 });
      sleep(1);
    }
  });
}