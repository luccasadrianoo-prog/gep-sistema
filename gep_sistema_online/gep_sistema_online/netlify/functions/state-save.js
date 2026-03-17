const { Client } = require('pg');

async function getClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  let client;
  try {
    const body = JSON.parse(event.body || '{}');
    const state = body.state;

    if (!state) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Estado não enviado' }),
      };
    }

    client = await getClient();
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(
      `INSERT INTO app_state (id, data, updated_at)
       VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(state)]
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao salvar dados', details: error.message }),
    };
  } finally {
    if (client) await client.end();
  }
};
