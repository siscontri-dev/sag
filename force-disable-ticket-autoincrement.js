import { sql } from "@vercel/postgres"

async function forceDisableTicketAutoincrement() {
  try {
    console.log(
      "Iniciando modificación de la estructura de la tabla para forzar el respeto de los valores de ticket...",
    )

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Eliminar TODOS los triggers de la tabla
    await sql`
      DO $$
      DECLARE
          trigger_name text;
      BEGIN
          FOR trigger_name IN (
              SELECT t.tgname
              FROM pg_trigger t
              JOIN pg_class c ON t.tgrelid = c.oid
              JOIN pg_namespace n ON c.relnamespace = n.oid
              WHERE n.nspname = 'public' AND c.relname = 'transaction_lines'
          )
          LOOP
              EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON transaction_lines CASCADE';
              RAISE NOTICE 'Dropped trigger: %', trigger_name;
          END LOOP;
      END $$;
    `
    console.log("✅ Todos los triggers han sido eliminados de la tabla transaction_lines")

    // 2. Modificar las columnas ticket y ticket2 para eliminar cualquier valor por defecto
    await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket DROP DEFAULT`
    await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket2 DROP DEFAULT`
    console.log("✅ Valores por defecto eliminados de las columnas ticket y ticket2")

    // 3. Verificar si hay secuencias asociadas y eliminarlas
    const sequencesResult = await sql`
      SELECT pg_get_serial_sequence('transaction_lines', 'ticket') as ticket_seq,
             pg_get_serial_sequence('transaction_lines', 'ticket2') as ticket2_seq
    `

    if (sequencesResult.rows[0].ticket_seq) {
      await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket TYPE INTEGER`
      console.log(`✅ Secuencia ${sequencesResult.rows[0].ticket_seq} desvinculada de la columna ticket`)
    }

    if (sequencesResult.rows[0].ticket2_seq) {
      await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket2 TYPE INTEGER`
      console.log(`✅ Secuencia ${sequencesResult.rows[0].ticket2_seq} desvinculada de la columna ticket2`)
    }

    // 4. Crear una función y un trigger que SOLO copie el valor de ticket a ticket2 si ticket2 es NULL
    // pero que NUNCA modifique el valor de ticket
    await sql`
      CREATE OR REPLACE FUNCTION copy_ticket_to_ticket2()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Solo si ticket2 es NULL, copiamos el valor de ticket
          IF NEW.ticket2 IS NULL THEN
              NEW.ticket2 := NEW.ticket;
          END IF;
          
          -- NUNCA modificamos el valor de ticket
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    await sql`
      CREATE TRIGGER ensure_ticket2_has_value
      BEFORE INSERT OR UPDATE ON transaction_lines
      FOR EACH ROW
      EXECUTE FUNCTION copy_ticket_to_ticket2();
    `
    console.log("✅ Creado nuevo trigger que solo copia ticket a ticket2 si ticket2 es NULL")

    // 5. Confirmar la transacción
    await sql`COMMIT`

    console.log(
      "\n✅ Proceso completado. La estructura de la tabla ha sido modificada para garantizar que los valores de ticket se respeten exactamente como se ingresan.",
    )
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("❌ Error al modificar la estructura de la tabla:", error)
  }
}

// Ejecutar la función
forceDisableTicketAutoincrement()
