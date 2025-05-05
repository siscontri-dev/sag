import pg from 'pg';
const { Pool } = pg;

// Usar directamente la cadena de conexión
const connectionString = 'postgresql://bovporc_owner:npg_Zck7tsfW8hJC@ep-rough-mode-a4ulp40x-pooler.us-east-1.aws.neon.tech/bovporc?sslmode=require';

async function checkConnection() {
  // Crear un pool de conexiones
  const pool = new Pool({ connectionString });
  
  try {
    console.log('Intentando conectar a la base de datos...');
    
    // Prueba simple de conexión
    const result = await pool.query('SELECT NOW() as current_time');
    
    console.log('✅ Conexión exitosa a la base de datos Neon');
    console.log(`Hora actual del servidor: ${result.rows[0].current_time}`);
    
    // Verificar tablas existentes
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\nTablas encontradas en la base de datos:');
    if (tablesResult.rows.length === 0) {
      console.log('No se encontraron tablas. Es posible que necesites crear la estructura de la base de datos.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      console.log(`\nTotal: ${tablesResult.rows.length} tablas`);
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  } finally {
    // Cerrar el pool de conexiones
    await pool.end();
  }
}

checkConnection();
