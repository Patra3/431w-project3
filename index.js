import postgres from "postgres";

const sql = postgres('', {
  host: '',
  port: 5432,
  username: 'postgres',
  password: false,
  database: 'p3',
  prepare: false
});

export default sql;