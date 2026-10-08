import 'dotenv/config';

export default {
  client: 'pg',
  connection: {
    host: process.env.LAWANG_DB_HOST,
    port: process.env.LAWANG_DB_PORT || 5432,
    database: process.env.LAWANG_DB_NAME,
    user: process.env.LAWANG_DB_USER,
    password: process.env.LAWANG_DB_PASSWORD,
  },
};
