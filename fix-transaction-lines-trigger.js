// Este script modifica el trigger que está causando el problema
// Ejecutar con: node fix-transaction-lines-trigger.js

import { sql } from "@vercel/postgres"

async function fixTransactionLinesTrigger() {
  try {
    console.log("Iniciando corrección del trigger en transaction_lines...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Primero, vamos a verificar si existe el trigger que genera el ticket2
    const triggerResult = await sql`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      AND event_object_schema = 'public'
      AND trigger_name = 'generate_ticket2_trigger'
    `

    if (triggerResult.rows.length === 0) {
      console.log("No se encontró el trigger 'generate_ticket2_trigger'. Verificando otros triggers...")

      const allTriggersResult = await sql`
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'transaction_lines'
        AND event_object_schema = 'public'
      `

      if (allTriggersResult.rows.length === 0) {
        console.log("No se encontraron triggers en la tabla transaction_lines")
        await sql`ROLLBACK`
        return
      }

      console.log("Triggers encontrados:", allTriggersResult.rows.map((t) => t.trigger_name).join(", "))
    }

    // 2. Eliminar el trigger existente (independientemente de su nombre)
    console.log("Eliminando triggers existentes en transaction_lines...")

    await sql`
      DROP TRIGGER IF EXISTS generate_ticket2_trigger ON transaction_lines;
      DROP TRIGGER IF EXISTS update_ticket2_trigger ON transaction_lines;
      DROP TRIGGER IF EXISTS before_insert_transaction_lines ON transaction_lines;
      DROP TRIGGER IF EXISTS after_insert_transaction_lines ON transaction_lines;
      DROP TRIGGER IF EXISTS before_update_transaction_lines ON transaction_lines;
      DROP TRIGGER IF EXISTS after_update_transaction_lines ON transaction_lines;
    `

    // 3. Eliminar las funciones asociadas
    console.log("Eliminando funciones asociadas...")

    await sql`
      DROP FUNCTION IF EXISTS generate_ticket2();
      DROP FUNCTION IF EXISTS update_ticket2();
      DROP FUNCTION IF EXISTS before_insert_transaction_lines();
      DROP FUNCTION IF EXISTS after_insert_transaction_lines();
      DROP FUNCTION IF EXISTS before_update_transaction_lines();
      DROP FUNCTION IF EXISTS after_update_transaction_lines();
    `

    // 4. Crear una nueva función que maneje correctamente los tipos TEXT
    console.log("Creando nueva función para generar ticket2...")

    await sql`
      CREATE OR REPLACE FUNCTION generate_ticket2()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Convertir explícitamente el ticket a INTEGER para la operación COALESCE
        -- Si no se puede convertir, usar 0 como valor predeterminado
        BEGIN
          NEW.ticket2 := COALESCE(
            (SELECT CAST(NEW.ticket AS INTEGER)),
            0
          );
        EXCEPTION WHEN OTHERS THEN
          -- Si hay un error en la conversión, usar 0
          NEW.ticket2 := 0;
        END;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    // 5. Crear un nuevo trigger que use la función actualizada
    console.log("Creando nuevo trigger...")

    await sql`
      CREATE TRIGGER generate_ticket2_trigger
      BEFORE INSERT ON transaction_lines
      FOR EACH ROW
      EXECUTE FUNCTION generate_ticket2();
    `

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Corrección del trigger completada con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al corregir el trigger:", error)
  } finally {
    process.exit(0)
  }
}

fixTransactionLinesTrigger()
