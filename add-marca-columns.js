import { sql } from "@vercel/postgres"

async function addMarcaColumns() {
  try {
    console.log("Verificando si las columnas 'marca' e 'imagen_url' existen en la tabla 'contacts'...")

    // Verificar si la columna 'marca' ya existe
    const checkMarcaColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contacts' 
      AND column_name = 'marca';
    `

    // Verificar si la columna 'imagen_url' ya existe
    const checkImagenUrlColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contacts' 
      AND column_name = 'imagen_url';
    `

    // Añadir columna 'marca' si no existe
    if (checkMarcaColumn.rowCount === 0) {
      console.log("Añadiendo columna 'marca' a la tabla 'contacts'...")
      await sql`
        ALTER TABLE contacts 
        ADD COLUMN marca VARCHAR(255);
      `
      console.log("Columna 'marca' añadida correctamente.")
    } else {
      console.log("La columna 'marca' ya existe en la tabla 'contacts'.")
    }

    // Añadir columna 'imagen_url' si no existe
    if (checkImagenUrlColumn.rowCount === 0) {
      console.log("Añadiendo columna 'imagen_url' a la tabla 'contacts'...")
      await sql`
        ALTER TABLE contacts 
        ADD COLUMN imagen_url TEXT;
      `
      console.log("Columna 'imagen_url' añadida correctamente.")
    } else {
      console.log("La columna 'imagen_url' ya existe en la tabla 'contacts'.")
    }

    console.log("Proceso completado con éxito.")
  } catch (error) {
    console.error("Error al añadir las columnas:", error)
  } finally {
    process.exit(0)
  }
}

addMarcaColumns()
