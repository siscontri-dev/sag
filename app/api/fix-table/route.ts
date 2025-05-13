import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 1. Eliminar cualquier trigger existente en la tabla
    const dropTriggersResult = await sql`
      DO $$ 
      DECLARE 
        trigger_rec RECORD;
      BEGIN
        FOR trigger_rec IN (
          SELECT trigger_name
          FROM information_schema.triggers
          WHERE event_object_table = 'transaction_lines'
          AND trigger_name NOT LIKE 'RI_%' -- Excluir triggers del sistema
        ) LOOP
          EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON transaction_lines';
        END LOOP;
      END $$;
    `

    // 2. Eliminar cualquier valor por defecto en la columna ticket
    const removeDefaultResult = await sql`
      ALTER TABLE transaction_lines 
      ALTER COLUMN ticket DROP DEFAULT;
    `

    // 3. Eliminar cualquier secuencia asociada a la columna ticket
    // (Esto es más seguro que intentar hacerlo directamente)
    const checkSequenceResult = await sql`
      SELECT pg_get_serial_sequence('transaction_lines', 'ticket') as ticket_sequence;
    `

    let sequenceMessage = "No hay secuencia asociada a la columna ticket"
    if (checkSequenceResult.rows[0].ticket_sequence) {
      sequenceMessage = `Secuencia encontrada: ${checkSequenceResult.rows[0].ticket_sequence}`
      // Si hay una secuencia, intentamos desvincularla
      await sql`
        ALTER TABLE transaction_lines 
        ALTER COLUMN ticket SET DEFAULT NULL;
      `
    }

    // 4. Asegurarse de que ticket2 siempre sea igual a ticket
    // Creamos un trigger simple que solo copia ticket a ticket2 si ticket2 es NULL
    const createTriggerResult = await sql`
      CREATE OR REPLACE FUNCTION copy_ticket_to_ticket2()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.ticket2 IS NULL THEN
              NEW.ticket2 = NEW.ticket;
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS copy_ticket_trigger ON transaction_lines;
      
      CREATE TRIGGER copy_ticket_trigger
      BEFORE INSERT OR UPDATE ON transaction_lines
      FOR EACH ROW
      EXECUTE FUNCTION copy_ticket_to_ticket2();
    `

    // 5. Corregir los valores existentes donde ticket2 != ticket
    const fixExistingResult = await sql`
      UPDATE transaction_lines
      SET ticket2 = ticket
      WHERE ticket2 != ticket;
    `

    return NextResponse.json({
      success: true,
      message: "Estructura de la tabla modificada correctamente",
      details: {
        triggers_eliminados: "Se eliminaron todos los triggers personalizados",
        secuencia: sequenceMessage,
        valores_corregidos: `Se actualizaron ${fixExistingResult.rowCount} filas donde ticket2 != ticket`,
        nuevo_trigger: "Se creó un nuevo trigger que solo copia ticket a ticket2 si ticket2 es NULL",
      },
    })
  } catch (error) {
    console.error("Error al modificar la tabla:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al modificar la tabla: ${error.message}`,
        error: error.stack,
      },
      { status: 500 },
    )
  }
}
