const { sql } = require("@vercel/postgres")

async function addUbicationToTransactions() {
  try {
    console.log("Iniciando la adición del campo ubication_contact_id a la tabla transactions...")

    // Verificar si la columna ya existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'ubication_contact_id'
    `

    if (checkColumn.rows.length === 0) {
      // Paso 1: Agregar el campo a la tabla transactions
      await sql`
        ALTER TABLE transactions
        ADD COLUMN ubication_contact_id INTEGER
      `
      console.log("Campo ubication_contact_id agregado correctamente.")

      // Verificar si la restricción ya existe
      const checkConstraint = await sql`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'transactions'
        AND constraint_name = 'fk_ubication_contact'
      `

      if (checkConstraint.rows.length === 0) {
        // Paso 2: Crear la relación de clave foránea
        await sql`
          ALTER TABLE transactions
          ADD CONSTRAINT fk_ubication_contact
          FOREIGN KEY (ubication_contact_id)
          REFERENCES ubication_contact(id)
          ON DELETE SET NULL
        `
        console.log("Restricción de clave foránea creada correctamente.")
      } else {
        console.log("La restricción de clave foránea ya existe.")
      }
    } else {
      console.log("El campo ubication_contact_id ya existe en la tabla transactions.")
    }

    console.log("Proceso completado con éxito.")
  } catch (error) {
    console.error("Error al modificar la tabla transactions:", error)
  }
}

// Ejecutar la función
addUbicationToTransactions()
