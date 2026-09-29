import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, group, sleep } from 'k6';

import { Public, Private, User } from '../data/endpoints.js';

const env = JSON.parse(
  open('../env/Lawang-Core.environment.json')
);

const { baseUrl, username, password } = env;

function executeEndpoint(endpoint, auth = null) {
  const url = `${baseUrl}${endpoint.path}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (auth) {
    params.headers.Authorization = `Basic ${auth}`;
  }

  let res;

  switch (endpoint.method.toUpperCase()) {
    case 'GET':
      res = http.get(url, params);
      break;

    case 'POST':
      res = http.post(
        url,
        JSON.stringify(endpoint.body ?? {}),
        params
      );
      break;

    case 'PUT':
      res = http.put(
        url,
        JSON.stringify(endpoint.body ?? {}),
        params
      );
      break;

    case 'PATCH':
      res = http.patch(
        url,
        JSON.stringify(endpoint.body ?? {}),
        params
      );
      break;

    case 'DELETE':
      res = http.del(url, null, params);
      break;

    default:
      throw new Error(
        `Unsupported HTTP method: ${endpoint.method}`
      );
  }

  check(res, {
    [`${endpoint.name} - ${endpoint.path}`]: (r) =>
      r.status >= 200 && r.status < 300,
  });

  // sleep(1);

  return res;
}

function executeGroup(groupName, endpoints, auth = null) {
  group(groupName, () => {
    for (const endpoint of endpoints) {
      executeEndpoint(endpoint, auth);
    }
  });
}

export function lawangScenario() {
  const auth = encoding.b64encode(
    `${username}:${password}`
  );

  executeGroup('Public', Public);

  executeGroup('Private', Private, auth);

  executeGroup('User', User, auth);
}