const { sql } = require("@vercel/postgres")

async function addTicket2Column() {
  try {
    console.log("Iniciando la adición de la columna ticket2 a transaction_lines...")

    // 1. Verificar si la columna ya existe
    const checkColumnResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket2'
    `

    if (checkColumnResult.rowCount > 0) {
      console.log("La columna ticket2 ya existe en la tabla transaction_lines.")
    } else {
      // 2. Añadir la columna ticket2
      await sql`ALTER TABLE transaction_lines ADD COLUMN ticket2 INTEGER`
      console.log("Columna ticket2 añadida correctamente.")
    }

    // 3. Asignar valores iniciales a los registros existentes
    await sql`
      WITH ranked_lines AS (
        SELECT
          tl.id AS line_id,
          ROW_NUMBER() OVER (
            PARTITION BY t.business_location_id
            ORDER BY tl.id
          ) AS row_num
        FROM transaction_lines tl
        JOIN transactions t ON t.id = tl.transaction_id
      )
      UPDATE transaction_lines tl
      SET ticket2 = rl.row_num
      FROM ranked_lines rl
      WHERE tl.id = rl.line_id AND tl.ticket2 IS NULL
    `
    console.log("Valores iniciales asignados a los registros existentes.")

    // 4. Verificar si la función ya existe
    const checkFunctionResult = await sql`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'assign_ticket2'
    `

    if (checkFunctionResult.rowCount > 0) {
      // Eliminar la función existente
      await sql`DROP FUNCTION IF EXISTS assign_ticket2() CASCADE`
      console.log("Función assign_ticket2 eliminada para recrearla.")
    }

    // 5. Crear la función para asignar automáticamente ticket2
    await sql`
      CREATE OR REPLACE FUNCTION assign_ticket2()
      RETURNS TRIGGER AS $$
      DECLARE
        location_id INTEGER;
        next_ticket INTEGER;
      BEGIN
        -- Obtener la ubicación desde la transacción relacionada
        SELECT business_location_id INTO location_id
        FROM transactions
        WHERE id = NEW.transaction_id;

        -- Calcular el siguiente número de ticket para esa ubicación
        SELECT COALESCE(MAX(ticket2), 0) + 1 INTO next_ticket
        FROM transaction_lines tl
        JOIN transactions t ON t.id = tl.transaction_id
        WHERE t.business_location_id = location_id;

        -- Asignar el número generado
        NEW.ticket2 := next_ticket;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
    console.log("Función assign_ticket2 creada correctamente.")

    // 6. Verificar si el trigger ya existe
    const checkTriggerResult = await sql`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgname = 'set_ticket2_before_insert'
    `

    if (checkTriggerResult.rowCount > 0) {
      // Eliminar el trigger existente
      await sql`DROP TRIGGER IF EXISTS set_ticket2_before_insert ON transaction_lines`
      console.log("Trigger set_ticket2_before_insert eliminado para recrearlo.")
    }

    // 7. Crear el trigger que usa esta función antes del INSERT
    await sql`
      CREATE TRIGGER set_ticket2_before_insert
      BEFORE INSERT ON transaction_lines
      FOR EACH ROW
      WHEN (NEW.ticket2 IS NULL)
      EXECUTE FUNCTION assign_ticket2();
    `
    console.log("Trigger set_ticket2_before_insert creado correctamente.")

    console.log("Proceso completado con éxito.")
  } catch (error) {
    console.error("Error al ejecutar el script:", error)
  }
}

// Ejecutar la función
addTicket2Column()
