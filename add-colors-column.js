import { sql } from "@vercel/postgres"

async function addColorsColumn() {
  try {
    // Verificar si la columna ya existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions' 
      AND column_name = 'colors'
    `

    if (checkColumn.rows.length === 0) {
      // La columna no existe, agregarla
      await sql`
        ALTER TABLE transactions 
        ADD COLUMN colors TEXT
      `
      console.log("Columna 'colors' añadida correctamente a la tabla transactions")
    } else {
      console.log("La columna 'colors' ya existe en la tabla transactions")
    }

    // Verificar si las columnas de impuestos existen
    const checkImpuesto1 = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions' 
      AND column_name = 'impuesto1'
    `

    if (checkImpuesto1.rows.length === 0) {
      // Las columnas no existen, agregarlas
      await sql`
        ALTER TABLE transactions 
        ADD COLUMN impuesto1 NUMERIC(14, 2) DEFAULT 0,
        ADD COLUMN impuesto2 NUMERIC(14, 2) DEFAULT 0,
        ADD COLUMN impuesto3 NUMERIC(14, 2) DEFAULT 0
      `
      console.log("Columnas de impuestos añadidas correctamente a la tabla transactions")
    } else {
      console.log("Las columnas de impuestos ya existen en la tabla transactions")
    }

    console.log("Proceso completado con éxito")
  } catch (error) {
    console.error("Error al añadir columnas:", error)
  }
}

addColorsColumn()
