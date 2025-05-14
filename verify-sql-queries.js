import { sql } from "@vercel/postgres"

async function verifyQueries() {
  try {
    console.log("Verificando consultas SQL en producción...")

    // Consulta 1: Obtener transacciones con formato de fecha sin zona horaria
    console.log("\n1. Consulta sin zona horaria:")
    const query1 = await sql`
      SELECT 
        id, 
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha,
        numero_documento,
        type
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 5
    `

    query1.rows.forEach((row) => {
      console.log(`ID: ${row.id}, Fecha: ${row.fecha}, Número: ${row.numero_documento}, Tipo: ${row.type}`)
    })

    // Consulta 2: Obtener transacciones con formato de fecha con zona horaria
    console.log("\n2. Consulta con zona horaria 'America/Bogota':")
    const query2 = await sql`
      SELECT 
        id, 
        TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha,
        numero_documento,
        type
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 5
    `

    query2.rows.forEach((row) => {
      console.log(`ID: ${row.id}, Fecha: ${row.fecha}, Número: ${row.numero_documento}, Tipo: ${row.type}`)
    })

    // Consulta 3: Obtener transacciones con formato de fecha con zona horaria UTC
    console.log("\n3. Consulta con zona horaria 'UTC':")
    const query3 = await sql`
      SELECT 
        id, 
        TO_CHAR(fecha_documento AT TIME ZONE 'UTC', 'DD/MM/YYYY') as fecha,
        numero_documento,
        type
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 5
    `

    query3.rows.forEach((row) => {
      console.log(`ID: ${row.id}, Fecha: ${row.fecha}, Número: ${row.numero_documento}, Tipo: ${row.type}`)
    })
  } catch (error) {
    console.error("Error al verificar consultas:", error)
  }
}

// Ejecutar la función
verifyQueries()
