import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { lawangScenario } from '../scenarios/lawang.scenario.js';

export const options = {
  insecureSkipTLSVerify: true,
  stages: [
   { duration: '2m', target: 100 },
    { duration: '3m', target: 300 },
    { duration: '4m', target: 600 },
    { duration: '3m', target: 1000 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.20'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  lawangScenario();
}

export function handleSummary(data) {
  const dir = __ENV.REPORT_DIR;
  const slug = __ENV.SCENARIO || 'report';
  if (!dir) return { 'core-report.html': htmlReport(data) };
  return {
    [`${dir}/k6-${slug}.html`]: htmlReport(data),
    [`${dir}/k6-${slug}.json`]: JSON.stringify(data),
  };
}