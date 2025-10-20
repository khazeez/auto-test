import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export const options = {
  insecureSkipTLSVerify: true,
  vus: 100,
  duration: '1m',
};

const baseUrl = 'http://202.72.206.162:2727';

export default function () {
  //untuk checking grup GET
  group('GET endpoints', function () {
    const getEndpoints = [
      '/http/ability/2',
      '/db/lawang',
      '/js/mock/user',
      '/lb/api/character',
      '/js/mock/external-get',
    ];

    for (const path of getEndpoints) {
      const res = http.get(`${baseUrl}${path}`);
      check(res, { [`${path}`]: (r) => r.status === 200 });
      sleep(1);
    }
  });
}

export function handleSummary(data) {
  return { 'report.html': htmlReport(data) };
}
