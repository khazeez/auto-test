import http from 'k6/http';
import { sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
    insecureSkipTLSVerify: true,
    vus: 250,
    iterations: 10000,
    duration: '1m',
};

export default function () {
    http.get('http://202.72.206.162:2727/http/ability/2');
    sleep(1);
    http.get('http://202.72.206.162:2727/db/lawang');
    sleep(1);
    http.get('http://202.72.206.162:2727/js/mock/user');
    sleep(1);
    http.get('http://202.72.206.162:2727/lb/api/character');
    sleep(1);
    http.get('http://202.72.206.162:2727/proxy/get-networks');
    sleep(1);
    http.get('http://202.72.206.162:2727/async/get-webhook');
    sleep(1);
}   

export function handleSummary(data) {
    return {
        "report.html": htmlReport(data),
    };
}
