import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar si existe la función generate_monthly_ticket_number
    const checkFunctionResult = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'FUNCTION' 
      AND routine_name = 'generate_monthly_ticket_number'
    `

    const functionExists = checkFunctionResult.rows.length > 0
    let message = ""

    if (functionExists) {
      // Modificar la función para respetar los valores de ticket proporcionados
      await sql`
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
          SELECT business_location_id INTO location_id FROM transactions WHERE id = NEW.transaction_id;
          
          -- Obtener el mes y año actuales
          current_month := EXTRACT(MONTH FROM CURRENT_DATE);
          current_year := EXTRACT(YEAR FROM CURRENT_DATE);
          
          -- Encontrar el ticket máximo para este mes y año
          SELECT COALESCE(MAX(tl.ticket), 0) INTO max_ticket
          FROM transaction_lines tl
          JOIN transactions t ON tl.transaction_id = t.id
          WHERE 
            t.business_location_id = location_id AND
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

      message += "Función generate_monthly_ticket_number modificada correctamente. "
    } else {
      // Crear la función si no existe
      await sql`
        CREATE FUNCTION generate_monthly_ticket_number()
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
          SELECT business_location_id INTO location_id FROM transactions WHERE id = NEW.transaction_id;
          
          -- Obtener el mes y año actuales
          current_month := EXTRACT(MONTH FROM CURRENT_DATE);
          current_year := EXTRACT(YEAR FROM CURRENT_DATE);
          
          -- Encontrar el ticket máximo para este mes y año
          SELECT COALESCE(MAX(tl.ticket), 0) INTO max_ticket
          FROM transaction_lines tl
          JOIN transactions t ON tl.transaction_id = t.id
          WHERE 
            t.business_location_id = location_id AND
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

      message += "Función generate_monthly_ticket_number creada correctamente. "
    }

    // Verificar si existe el trigger tr_generate_monthly_ticket
    const checkTriggerResult = await sql`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'transaction_lines' 
      AND trigger_name = 'tr_generate_monthly_ticket'
    `

    const triggerExists = checkTriggerResult.rows.length > 0

    if (triggerExists) {
      // Eliminar el trigger existente
      await sql`DROP TRIGGER IF EXISTS tr_generate_monthly_ticket ON transaction_lines`
      message += "Trigger tr_generate_monthly_ticket eliminado. "
    }

    // Crear el nuevo trigger
    await sql`
      CREATE TRIGGER tr_generate_monthly_ticket
      BEFORE INSERT ON transaction_lines
      FOR EACH ROW
      EXECUTE FUNCTION generate_monthly_ticket_number();
    `

    message += "Trigger tr_generate_monthly_ticket creado correctamente."

    return NextResponse.json({
      success: true,
      message: message,
    })
  } catch (error) {
    console.error("Error al modificar la función:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
