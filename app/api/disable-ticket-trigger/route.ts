import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar si existe el trigger
    const checkTriggerResult = await sql`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'transaction_lines' 
      AND trigger_name = 'tr_generate_monthly_ticket'
    `

    const triggerExists = checkTriggerResult.rows.length > 0

    if (triggerExists) {
      // Eliminar el trigger completamente
      await sql`DROP TRIGGER IF EXISTS tr_generate_monthly_ticket ON transaction_lines`

      // Crear un nuevo trigger que solo establezca ticket2 = ticket si ticket2 es NULL
      await sql`
        CREATE OR REPLACE FUNCTION set_ticket2_from_ticket()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Si ticket2 es NULL, establecerlo igual a ticket
          IF NEW.ticket2 IS NULL THEN
            NEW.ticket2 = NEW.ticket;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `

      await sql`
        CREATE TRIGGER tr_set_ticket2
        BEFORE INSERT ON transaction_lines
        FOR EACH ROW
        EXECUTE FUNCTION set_ticket2_from_ticket();
      `

      return NextResponse.json({
        success: true,
        message:
          "Trigger tr_generate_monthly_ticket eliminado y reemplazado por tr_set_ticket2. Ahora los valores de ticket se respetarán exactamente como se ingresan en el frontend, y ticket2 se establecerá igual a ticket si no se proporciona.",
      })
    } else {
      // Crear un nuevo trigger que solo establezca ticket2 = ticket si ticket2 es NULL
      await sql`
        CREATE OR REPLACE FUNCTION set_ticket2_from_ticket()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Si ticket2 es NULL, establecerlo igual a ticket
          IF NEW.ticket2 IS NULL THEN
            NEW.ticket2 = NEW.ticket;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `

      await sql`
        CREATE TRIGGER tr_set_ticket2
        BEFORE INSERT ON transaction_lines
        FOR EACH ROW
        EXECUTE FUNCTION set_ticket2_from_ticket();
      `

      return NextResponse.json({
        success: true,
        message:
          "El trigger tr_generate_monthly_ticket no existe. Se ha creado un nuevo trigger tr_set_ticket2 que establece ticket2 = ticket si ticket2 es NULL.",
      })
    }
  } catch (error) {
    console.error("Error al modificar los triggers:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
