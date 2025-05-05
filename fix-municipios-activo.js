import { sql } from "@vercel/postgres"

async function fixMunicipiosActivo() {
  try {
    console.log("Verificando columna 'activo' en tabla municipios...")

    // Verificar si la columna activo existe
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'municipios'
        AND column_name = 'activo'
      ) as exists
    `

    if (!columnCheck.rows[0].exists) {
      console.log("La columna 'activo' no existe en la tabla municipios. Añadiendo columna...")

      await sql`ALTER TABLE municipios ADD COLUMN activo BOOLEAN DEFAULT TRUE`
      console.log("Columna 'activo' añadida correctamente.")
    } else {
      console.log("La columna 'activo' ya existe en la tabla municipios.")
    }

    // Verificar municipios sin valor activo
    const nullCheck = await sql`
      SELECT COUNT(*) as count FROM municipios WHERE activo IS NULL
    `

    if (nullCheck.rows[0].count > 0) {
      console.log(`Encontrados ${nullCheck.rows[0].count} municipios con activo NULL. Actualizando...`)

      await sql`UPDATE municipios SET activo = TRUE WHERE activo IS NULL`
      console.log("Municipios actualizados correctamente.")
    } else {
      console.log("No hay municipios con activo NULL.")
    }

    // Verificar municipios activos e inactivos
    const activeCount = await sql`SELECT COUNT(*) as count FROM municipios WHERE activo = TRUE`
    const inactiveCount = await sql`SELECT COUNT(*) as count FROM municipios WHERE activo = FALSE`

    console.log(`Municipios activos: ${activeCount.rows[0].count}`)
    console.log(`Municipios inactivos: ${inactiveCount.rows[0].count}`)
  } catch (error) {
    console.error("Error al verificar/corregir columna activo:", error)
  }
}

fixMunicipiosActivo()
