import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
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
          END LOOP;
      END $$;
    `

    // 2. Modificar las columnas ticket y ticket2 para eliminar cualquier valor por defecto
    await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket DROP DEFAULT`
    await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket2 DROP DEFAULT`

    // 3. Verificar si hay secuencias asociadas y eliminarlas
    const sequencesResult = await sql`
      SELECT pg_get_serial_sequence('transaction_lines', 'ticket') as ticket_seq,
             pg_get_serial_sequence('transaction_lines', 'ticket2') as ticket2_seq
    `

    if (sequencesResult.rows[0].ticket_seq) {
      await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket TYPE INTEGER`
    }

    if (sequencesResult.rows[0].ticket2_seq) {
      await sql`ALTER TABLE transaction_lines ALTER COLUMN ticket2 TYPE INTEGER`
    }

    // 4. Crear una función y un trigger que SOLO copie el valor de ticket a ticket2 si ticket2 es NULL
    await sql`
      CREATE OR REPLACE FUNCTION copy_ticket_to_ticket2()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.ticket2 IS NULL THEN
              NEW.ticket2 := NEW.ticket;
          END IF;
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

    return NextResponse.json({
      success: true,
      message: "Triggers deshabilitados y estructura de tabla modificada correctamente",
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al modificar la estructura: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
