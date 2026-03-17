const { Client } = require('pg');

async function getClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

exports.handler = async () => {
  let client;
  try {
    client = await getClient();
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await client.query('SELECT data FROM app_state WHERE id = 1');
    const state = result.rows[0]?.data || null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao carregar dados', details: error.message }),
    };
  } finally {
    if (client) await client.end();
  }
};
