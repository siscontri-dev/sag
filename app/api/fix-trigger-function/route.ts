import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 1. Primero, obtener la definición actual de la función
    const getFunctionResult = await sql`
      SELECT pg_get_functiondef(oid) as function_def
      FROM pg_proc
      WHERE proname = 'generate_monthly_ticket_number';
    `

    let originalFunction = "No se encontró la función"
    if (getFunctionResult.rows.length > 0) {
      originalFunction = getFunctionResult.rows[0].function_def
    }

    // 2. Modificar la función para respetar los valores de ticket proporcionados
    const modifyFunctionResult = await sql`
      CREATE OR REPLACE FUNCTION generate_monthly_ticket_number()
      RETURNS TRIGGER AS $$
      DECLARE
        current_month INTEGER;
        current_year INTEGER;
        max_ticket INTEGER;
        location_id INTEGER;
      BEGIN
        -- Si ya se proporcionó un valor para ticket, respetarlo
        IF NEW.ticket IS NOT NULL THEN
          -- Solo asignar ticket2 si es NULL
          IF NEW.ticket2 IS NULL THEN
            NEW.ticket2 = NEW.ticket;
          END IF;
          RETURN NEW;
        END IF;

        -- El resto de la función se ejecuta solo si ticket es NULL
        -- Obtener el ID de ubicación de la transacción
        SELECT location_id INTO location_id FROM transactions WHERE id = NEW.transaction_id;
        
        -- Obtener el mes y año actuales
        current_month := EXTRACT(MONTH FROM CURRENT_DATE);
        current_year := EXTRACT(YEAR FROM CURRENT_DATE);
        
        -- Encontrar el ticket máximo para este mes y año
        SELECT COALESCE(MAX(tl.ticket), 0) INTO max_ticket
        FROM transaction_lines tl
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE 
          t.location_id = location_id AND
          EXTRACT(MONTH FROM t.fecha_creacion) = current_month AND
          EXTRACT(YEAR FROM t.fecha_creacion) = current_year;
        
        -- Asignar el siguiente número de ticket
        NEW.ticket := max_ticket + 1;
        
        -- Asignar ticket2 = ticket
        NEW.ticket2 := NEW.ticket;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    // 3. Verificar que el trigger existe y usa esta función
    const checkTriggerResult = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      AND trigger_name = 'tr_generate_monthly_ticket';
    `

    let triggerExists = false
    let triggerInfo = {}

    if (checkTriggerResult.rows.length > 0) {
      triggerExists = true
      triggerInfo = checkTriggerResult.rows[0]
    } else {
      // Si el trigger no existe, lo creamos
      await sql`
        CREATE TRIGGER tr_generate_monthly_ticket
        BEFORE INSERT ON transaction_lines
        FOR EACH ROW
        EXECUTE FUNCTION generate_monthly_ticket_number();
      `
      triggerInfo = {
        trigger_name: "tr_generate_monthly_ticket",
        event_manipulation: "INSERT",
        action_statement: "EXECUTE FUNCTION generate_monthly_ticket_number()",
      }
    }

    return NextResponse.json({
      success: true,
      message: "Función modificada correctamente para respetar los valores de ticket proporcionados",
      details: {
        original_function: originalFunction,
        trigger_exists: triggerExists,
        trigger_info: triggerInfo,
      },
    })
  } catch (error) {
    console.error("Error al modificar la función:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al modificar la función: ${error.message}`,
        error: error.stack,
      },
      { status: 500 },
    )
  }
}
