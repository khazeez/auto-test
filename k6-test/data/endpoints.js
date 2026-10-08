export const Public = [
  {
    name: 'HTTP POST',
    method: 'POST',
    path: '/post/test',
    body: {
      name: "Agus Buntung",
      Age: "60"
    }
  },
  {
    name: 'HTTP GET',
    method: 'GET',
    path: '/v2.1/http/ability/2',
  },
  // {
  //   name: 'HTTP PUT',
  //   method: 'PUT',
  //   path: '/products/2',
  //   body: {
  //     title: "update product",
  //     price: 999
  //   }
  // },
  // {
  //   name: 'HTTP DELETE',
  //   method: 'DELETE',
  //   path: '/users/2',
  //   body: {
  //     id: '1',
  //     isDeleted: true,
  //     deletedOn: '2026-05-13T10:00:00.000Z'
  //   }
  // },
  // {
  //   name: "HTTP PATCH",
  //   method: 'PATCH',
  //   path: '/products/2',
  //   body: {
  //     price: 777
  //   }
  // },
  {
    name: 'Javascript GET',
    method: 'GET',
    path: '/js-req/get'
  },
  {
    name: 'Javascript POST',
    method: 'POST',
    path: '/v2.1/js/post-httpbin',
    body: {
      Name: "Lawang"
    }
  },
  {
    name: 'Javascript PUT',
    method: 'PUT',
    path: '/v2.1/js/put-httpbin'
  },
  {
    name: 'Javascript PATCH',
    method: 'PATCH',
    path: '/v2.1/js/patch-httpbin'
  },
  {
    name: 'Javascript DELETE',
    method: 'DELETE',
    path: '/v2.1/js/delete-httpbin'
  },
  // {
  //   name: 'Load balancer GET',
  //   method: 'GET',
  //   path: '/v2.1/lb/api/character'
  // },
  {
    name: 'Asynchronus POST',
    method: 'POST',
    path: '/2cf57b93-4e9c-4ee4-b42d-534e7bdc8019',
    body: {
      id: '2cf57b93-4e9c-4ee4-b42d-534e7bdc8019',
      payload: {
        Name: "webhook-lawang"
      }
    }
  },
  {
    name: 'Proxy GET',
    method: 'GET',
    path: '/proxy/httpbin/get',
  },
  {
    name: 'Event Drivent POST',
    method: 'POST',
    path: '/v2.1/event_driven/lawang',
    body: {
      Program: "Public API"
    }
  },
  {
  name: 'File GET',
  method: 'GET',
  path: '/testo/hallo.txt'
  },
//   {
//     name: 'GraphQL POST',
//     method: 'POST',
//     path: '/rick-and-morty',
//     body: {
//       query: `query {
//   characters(page: 1) {
//     results {
//       id
//       name
//       status
//       species
//     }
//   }
// }`
//     }
//   }

];

export const Private = [
  // {
  //   name: 'HTTP GET',
  //   method: 'GET',
  //   path: '/v2.1/lb/api/location',
  // },
  {
    name: 'Database GET',
    method: 'GET',
    path: '/v2.1/db/rag',
  },
  {
    name: 'Asynchronus GET',
    method: 'GET',
    path: '/v2.1/async/get-webhook',
  },
  {
    name: 'SFTP GET',
    method: 'GET',
    path: '/162-sftp/data/lawang.txt'
  }
];

export const User = [
  {
    name: 'External Get',
    method: 'GET',
    path: '/v2.1/js/mock/external-get',
  },
  // {
  //   name: 'Episode',
  //   method: 'GET',
  //   path: '/v2.1/lb/api/episode',
  // },
  {
    name: 'RAG User',
    method: 'GET',
    path: '/v2.1/db/rag-user',
  },
  {
    name: 'Anything',
    method: 'GET',
    path: '/get/anything',
  },
  {
    name: 'S3 GET',
    method: 'GET',
    path: '/minion/minio.txt',
  }
];