import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Paso 1: Verificar triggers existentes
    const triggersResult = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines';
    `

    // Paso 2: Verificar la estructura actual de la tabla
    const tableStructureResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      ORDER BY ordinal_position;
    `

    // Paso 3: Verificar restricciones
    const constraintsResult = await sql`
      SELECT con.conname as constraint_name, 
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'transaction_lines'
      AND nsp.nspname = 'public';
    `

    // Paso 4: Eliminar triggers problemáticos (solo los que no son del sistema)
    // Identificamos los triggers que no son del sistema y los eliminamos
    const userTriggers = triggersResult.rows.filter(
      (trigger) => !trigger.trigger_name.startsWith("RI_") && !trigger.trigger_name.startsWith("pg_"),
    )

    const dropTriggerResults = []
    for (const trigger of userTriggers) {
      try {
        await sql`
          DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON transaction_lines;
        `
        dropTriggerResults.push({
          trigger_name: trigger.trigger_name,
          status: "eliminado",
        })
      } catch (error) {
        dropTriggerResults.push({
          trigger_name: trigger.trigger_name,
          status: "error",
          message: error.message,
        })
      }
    }

    // Paso 5: Crear una nueva función que respete los valores de ticket
    await sql`
      CREATE OR REPLACE FUNCTION respect_ticket_values()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Solo asignar ticket2 = ticket si ticket2 es NULL
          -- Esto permite que los valores proporcionados se respeten
          IF NEW.ticket2 IS NULL THEN
              NEW.ticket2 = NEW.ticket;
          END IF;
          
          -- Nunca modificar el valor de ticket
          -- Esto asegura que el valor proporcionado se mantenga
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Paso 6: Crear un nuevo trigger que use esta función
    await sql`
      DROP TRIGGER IF EXISTS respect_ticket_trigger ON transaction_lines;
    `

    await sql`
      CREATE TRIGGER respect_ticket_trigger
      BEFORE INSERT OR UPDATE ON transaction_lines
      FOR EACH ROW
      EXECUTE FUNCTION respect_ticket_values();
    `

    // Paso 7: Verificar los triggers después de los cambios
    const newTriggersResult = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines';
    `

    // Paso 8: Verificar y corregir valores existentes
    const fixExistingResult = await sql`
      UPDATE transaction_lines
      SET ticket2 = ticket
      WHERE ticket2 != ticket;
    `

    return NextResponse.json({
      success: true,
      message: "Configuración de tickets actualizada correctamente",
      details: {
        triggers_antes: triggersResult.rows,
        estructura_tabla: tableStructureResult.rows,
        restricciones: constraintsResult.rows,
        triggers_eliminados: dropTriggerResults,
        triggers_despues: newTriggersResult.rows,
        filas_corregidas: fixExistingResult.rowCount,
      },
      instrucciones:
        "Ahora puedes crear guías con valores de ticket específicos y se respetarán exactamente como los ingreses.",
    })
  } catch (error) {
    console.error("Error al ejecutar las consultas SQL:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al actualizar la configuración de tickets: ${error.message}`,
        error: error.stack,
      },
      { status: 500 },
    )
  }
}
