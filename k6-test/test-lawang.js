import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

const env = JSON.parse(open('env/Lawang-Core.environment.json'));
const { baseUrl, username, password } = env;

export const options = {
  insecureSkipTLSVerify: true,
  vus: 100,
  duration: '1m',
};

const Public = [
  '/v2.1/http/ability/2',
  '/v2.1/http/res-transformation',
  '/v2.1/db/lawang',
  '/v2.1/js/mock/user',
  '/v2.1/js/get-httpbin',
  '/v2.1/js/get/headers-httpbin',
  '/v2.1/lb/api/character',
  '/v2.1/js/decrypt',
  '/proxy/httpbin/get',
];

const Private = [
  '/v2.1/http/generation/2',
  '/v2.1/lb/api/location',
  '/v2.1/db/rag',
  '/proxy/poke-api/berry',
];

const User = [
  '/v2.1/js/mock/external-get',
  '/v2.1/lb/api/episode',
  '/v2.1/db/rag-user',
  '/get/anything',
  '/minion/minio.txt',
  '/minion/minio.txt',
];

export default function () {
  group('Public', () => {
    for (const path of Public) {
      const res = http.get(`${baseUrl}${path}`);

      check(res, {
        [`${path}`]: r => r.status === 200,
      });

      sleep(1);
    }
  });

  group('Private', () => {
    const auth = encoding.b64encode(`${username}:${password}`);

    for (const path of Private) {
      const res = http.get(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      check(res, {
        [`${path}`]: r => r.status === 200,
      });
    }

    sleep(1);
  });

  group('User', () => {
    const auth = encoding.b64encode(`${username}:${password}`);

    for (const path of User) {
      const res = http.get(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      check(res, {
        [`${path}`]: r => r.status === 200,
      });
    }

    sleep(1);
  });
}

export function handleSummary(data) {
  return { 'core-report.html': htmlReport(data) };
}