import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { lawangScenario } from '../scenarios/lawang.scenario.js';

export const options = {
  insecureSkipTLSVerify: true,
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  lawangScenario();
}

export function handleSummary(data) {
  return { 'core-report.html': htmlReport(data) };
}