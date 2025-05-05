import { sql } from "@vercel/postgres"

async function checkMunicipios() {
  try {
    console.log("Verificando municipios por departamento...")

    // Obtener todos los departamentos
    const departamentos = await sql`
      SELECT id, name FROM departamentos WHERE activo = TRUE ORDER BY name
    `

    console.log(`Encontrados ${departamentos.rows.length} departamentos activos`)

    // Verificar municipios para cada departamento
    for (const depto of departamentos.rows) {
      const municipios = await sql`
        SELECT id, name FROM municipios 
        WHERE id_departamento = ${depto.id} AND activo = TRUE
        ORDER BY name
      `

      console.log(`Departamento: ${depto.name} (ID: ${depto.id}) - ${municipios.rows.length} municipios`)

      // Mostrar los primeros 5 municipios como muestra
      if (municipios.rows.length > 0) {
        console.log("  Ejemplos de municipios:")
        municipios.rows.slice(0, 5).forEach((mun) => {
          console.log(`  - ${mun.name} (ID: ${mun.id})`)
        })
      }
    }
  } catch (error) {
    console.error("Error al verificar municipios:", error)
  }
}

checkMunicipios()
