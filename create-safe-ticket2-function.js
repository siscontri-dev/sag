// Este script crea una función segura para generar ticket2 que maneja correctamente
// la conversión entre TEXT e INTEGER
// Ejecutar con: node create-safe-ticket2-function.js

import { sql } from "@vercel/postgres"

async function createSafeTicket2Function() {
  try {
    console.log("Creando función segura para generar ticket2...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Eliminar la función existente si existe
    await sql`
      DROP FUNCTION IF EXISTS generate_ticket2();
    `

    // 2. Crear una nueva función que maneje de forma segura la conversión de tipos
    await sql`
      CREATE OR REPLACE FUNCTION generate_ticket2()
      RETURNS TRIGGER AS $$
      DECLARE
        ticket_value INTEGER;
      BEGIN
        -- Intentar convertir el ticket a INTEGER de forma segura
        BEGIN
          -- Si ticket es NULL o vacío, usar 0
          IF NEW.ticket IS NULL OR NEW.ticket = '' THEN
            ticket_value := 0;
          ELSE
            -- Intentar convertir a INTEGER
            ticket_value := CAST(NEW.ticket AS INTEGER);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Si hay un error en la conversión, usar 0
          ticket_value := 0;
        END;
        
        -- Asignar el valor convertido a ticket2
        NEW.ticket2 := ticket_value;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    // 3. Crear un nuevo trigger que use la función actualizada
    await sql`
      DROP TRIGGER IF EXISTS generate_ticket2_trigger ON transaction_lines;
    `

    await sql`
      CREATE TRIGGER generate_ticket2_trigger
      BEFORE INSERT OR UPDATE ON transaction_lines
      FOR EACH ROW
      EXECUTE FUNCTION generate_ticket2();
    `

    // 4. Actualizar los registros existentes
    await sql`
      UPDATE transaction_lines
      SET ticket2 = CASE
        WHEN ticket ~ '^[0-9]+$' THEN CAST(ticket AS INTEGER)
        ELSE 0
      END
      WHERE ticket IS NOT NULL;
    `

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Función segura para generar ticket2 creada con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al crear la función segura:", error)
  } finally {
    process.exit(0)
  }
}

createSafeTicket2Function()
