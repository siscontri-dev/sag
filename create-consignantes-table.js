const { sql } = require("@vercel/postgres")

async function createConsignantesTable() {
  try {
    // Verificar si la tabla ya existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consignantes'
      ) as exists
    `

    if (tableExists.rows[0].exists) {
      console.log("La tabla consignantes ya existe.")
      return
    }

    // Crear la tabla consignantes
    await sql`
      CREATE TABLE consignantes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        location_id INTEGER NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Crear un índice único para evitar duplicados
    await sql`
      CREATE UNIQUE INDEX idx_consignantes_nombre_location_id 
      ON consignantes(nombre, location_id) 
      WHERE activo = TRUE
    `

    console.log("Tabla consignantes creada correctamente.")

    // Insertar datos de ejemplo para bovinos (location_id = 1)
    await sql`
      INSERT INTO consignantes (nombre, location_id) VALUES
      ('Ganadería El Prado', 1),
      ('Finca Los Alamos', 1),
      ('Hacienda San José', 1),
      ('Ganadería El Retiro', 1),
      ('Finca La Esperanza', 1)
    `

    // Insertar datos de ejemplo para porcinos (location_id = 2)
    await sql`
      INSERT INTO consignantes (nombre, location_id) VALUES
      ('Porcícola Santa Ana', 2),
      ('Granja El Paraíso', 2),
      ('Porcícola San Pedro', 2),
      ('Granja Los Pinos', 2),
      ('Porcícola El Edén', 2)
    `

    console.log("Datos de ejemplo insertados correctamente.")
  } catch (error) {
    console.error("Error al crear la tabla consignantes:", error)
  }
}

createConsignantesTable()
  .then(() => {
    console.log("Proceso completado.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error en el proceso:", error)
    process.exit(1)
  })
