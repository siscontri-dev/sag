import { sql } from "@vercel/postgres"

async function checkDatabaseStructure() {
  try {
    console.log("Verificando estructura de la base de datos...")

    // Verificar tablas existentes
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log("\nTablas encontradas en la base de datos:")
    if (tablesResult.rows.length === 0) {
      console.log("No se encontraron tablas.")
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`- ${row.table_name}`)
      })
      console.log(`\nTotal: ${tablesResult.rows.length} tablas`)
    }

    // Verificar estructura de la tabla transactions
    console.log("\nVerificando estructura de la tabla transactions:")
    const transactionsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions'
      ORDER BY ordinal_position
    `

    if (transactionsColumns.rows.length === 0) {
      console.log("La tabla transactions no existe o no tiene columnas.")
    } else {
      transactionsColumns.rows.forEach((col) => {
        console.log(`- ${col.column_name} (${col.data_type})`)
      })
    }

    // Verificar estructura de la tabla municipios
    console.log("\nVerificando estructura de la tabla municipios:")
    const municipiosColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'municipios'
      ORDER BY ordinal_position
    `

    if (municipiosColumns.rows.length === 0) {
      console.log("La tabla municipios no existe o no tiene columnas.")
    } else {
      municipiosColumns.rows.forEach((col) => {
        console.log(`- ${col.column_name} (${col.data_type})`)
      })
    }

    // Verificar datos de municipios
    console.log("\nVerificando datos de municipios:")
    const municipiosCount = await sql`
      SELECT COUNT(*) as count FROM municipios
    `
    console.log(`Total de municipios: ${municipiosCount.rows[0].count}`)

    // Verificar datos de departamentos
    console.log("\nVerificando datos de departamentos:")
    const departamentosCount = await sql`
      SELECT COUNT(*) as count FROM departamentos
    `
    console.log(`Total de departamentos: ${departamentosCount.rows[0].count}`)

    // Verificar relación entre departamentos y municipios
    console.log("\nVerificando relación entre departamentos y municipios:")
    const departamentosMunicipios = await sql`
      SELECT d.id, d.name, COUNT(m.id) as municipios_count
      FROM departamentos d
      LEFT JOIN municipios m ON d.id = m.id_departamento
      GROUP BY d.id, d.name
      ORDER BY d.name
    `

    departamentosMunicipios.rows.forEach((row) => {
      console.log(`- ${row.name}: ${row.municipios_count} municipios`)
    })
  } catch (error) {
    console.error("Error al verificar la estructura de la base de datos:", error)
  }
}

checkDatabaseStructure()
