import { sql } from "@vercel/postgres"

async function insertTestMunicipios() {
  try {
    console.log("Verificando y creando municipios de prueba...")

    // Verificar si hay municipios en la base de datos
    const countResult = await sql`SELECT COUNT(*) as count FROM municipios`
    const municipiosCount = countResult.rows[0].count

    console.log(`Número actual de municipios: ${municipiosCount}`)

    if (municipiosCount > 0) {
      console.log("Ya existen municipios en la base de datos. No se insertarán datos de prueba.")
      return
    }

    // Verificar si existen departamentos
    const deptosResult = await sql`SELECT id, name FROM departamentos LIMIT 5`

    if (deptosResult.rows.length === 0) {
      console.log("No hay departamentos en la base de datos. Insertando departamentos de prueba...")

      // Insertar departamentos de prueba
      await sql`
        INSERT INTO departamentos (id, name, cod_dian, activo) VALUES 
        (1, 'Antioquia', '05', TRUE),
        (2, 'Atlántico', '08', TRUE),
        (3, 'Bogotá D.C.', '11', TRUE),
        (4, 'Bolívar', '13', TRUE),
        (5, 'Boyacá', '15', TRUE)
        ON CONFLICT (id) DO NOTHING
      `

      console.log("Departamentos de prueba insertados.")
    }

    // Insertar municipios de prueba para cada departamento
    const departamentos = [
      { id: 1, name: "Antioquia" },
      { id: 2, name: "Atlántico" },
      { id: 3, name: "Bogotá D.C." },
      { id: 4, name: "Bolívar" },
      { id: 5, name: "Boyacá" },
    ]

    for (const depto of departamentos) {
      console.log(`Insertando municipios para ${depto.name}...`)

      // Insertar 5 municipios de prueba para cada departamento
      await sql`
        INSERT INTO municipios (id, name, id_departamento, cod_dian, activo) VALUES 
        (${depto.id * 100 + 1}, 'Municipio 1 de ${depto.name}', ${depto.id}, '001', TRUE),
        (${depto.id * 100 + 2}, 'Municipio 2 de ${depto.name}', ${depto.id}, '002', TRUE),
        (${depto.id * 100 + 3}, 'Municipio 3 de ${depto.name}', ${depto.id}, '003', TRUE),
        (${depto.id * 100 + 4}, 'Municipio 4 de ${depto.name}', ${depto.id}, '004', TRUE),
        (${depto.id * 100 + 5}, 'Municipio 5 de ${depto.name}', ${depto.id}, '005', TRUE)
        ON CONFLICT (id) DO NOTHING
      `

      console.log(`Municipios insertados para ${depto.name}`)
    }

    // Verificar los municipios insertados
    const finalCountResult = await sql`SELECT COUNT(*) as count FROM municipios`
    console.log(`Número final de municipios: ${finalCountResult.rows[0].count}`)
  } catch (error) {
    console.error("Error al insertar municipios de prueba:", error)
  }
}

insertTestMunicipios()
