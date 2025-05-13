import { sql } from "@vercel/postgres"

async function disableTicketAutoincrement() {
  try {
    console.log("Iniciando proceso para deshabilitar la modificación automática de tickets...")

    // 1. Verificar si hay triggers que modifican el campo ticket
    console.log("Buscando triggers en la tabla transaction_lines...")
    const triggersResult = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      ORDER BY trigger_name
    `

    // Almacenar los nombres de los triggers que modifican ticket
    const ticketTriggers = []

    if (triggersResult.rows.length > 0) {
      console.log(`Se encontraron ${triggersResult.rows.length} triggers:`)

      for (const trigger of triggersResult.rows) {
        console.log(`- ${trigger.trigger_name} (${trigger.event_manipulation})`)

        // Verificar si el trigger modifica el campo ticket
        if (
          trigger.action_statement.includes("ticket") ||
          trigger.action_statement.includes("NEW.ticket") ||
          trigger.action_statement.includes("nextval")
        ) {
          console.log(`  ¡ATENCIÓN! Este trigger parece modificar el campo ticket.`)
          ticketTriggers.push(trigger.trigger_name)
        }
      }
    } else {
      console.log("No se encontraron triggers en la tabla transaction_lines")
    }

    // 2. Verificar si la columna ticket tiene un valor por defecto (secuencia)
    console.log("\nVerificando la definición de la columna ticket...")
    const columnDefResult = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket'
    `

    let hasSequence = false
    let sequenceName = null

    if (columnDefResult.rows.length > 0) {
      const columnDef = columnDefResult.rows[0]
      console.log(`Nombre: ${columnDef.column_name}`)
      console.log(`Tipo de datos: ${columnDef.data_type}`)
      console.log(`Valor por defecto: ${columnDef.column_default || "ninguno"}`)

      if (columnDef.column_default && columnDef.column_default.includes("nextval")) {
        console.log(`¡ATENCIÓN! La columna ticket tiene un valor por defecto que utiliza una secuencia.`)
        hasSequence = true

        // Extraer el nombre de la secuencia
        const match = columnDef.column_default.match(/nextval\('([^']+)'/)
        if (match && match[1]) {
          sequenceName = match[1]
          console.log(`Nombre de la secuencia: ${sequenceName}`)
        }
      }
    }

    // 3. Ejecutar las modificaciones necesarias
    console.log("\n=== APLICANDO CAMBIOS ===")

    // Iniciar transacción
    await sql`BEGIN`

    try {
      // 3.1 Deshabilitar triggers que modifican ticket
      if (ticketTriggers.length > 0) {
        console.log(`\nDeshabilitando ${ticketTriggers.length} triggers que modifican ticket...`)

        for (const triggerName of ticketTriggers) {
          console.log(`- Deshabilitando trigger: ${triggerName}`)
          await sql.query(`ALTER TABLE transaction_lines DISABLE TRIGGER ${triggerName}`)
        }

        console.log("Triggers deshabilitados correctamente.")
      }

      // 3.2 Eliminar el valor por defecto (secuencia) de la columna ticket
      if (hasSequence) {
        console.log("\nEliminando el valor por defecto de la columna ticket...")
        await sql.query(`ALTER TABLE transaction_lines ALTER COLUMN ticket DROP DEFAULT`)
        console.log("Valor por defecto eliminado correctamente.")
      }

      // 3.3 Crear un nuevo trigger que respete los valores proporcionados
      console.log("\nCreando un nuevo trigger que respete los valores proporcionados...")

      // Primero eliminamos el trigger si ya existe
      try {
        await sql.query(`DROP TRIGGER IF EXISTS respect_ticket_values ON transaction_lines`)
      } catch (error) {
        console.log("No se pudo eliminar el trigger anterior, continuando...")
      }

      // Crear el nuevo trigger
      await sql.query(`
        CREATE OR REPLACE FUNCTION respect_ticket_values_func()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Si ticket2 no está establecido, usar el mismo valor que ticket
          IF NEW.ticket2 IS NULL THEN
            NEW.ticket2 = NEW.ticket;
          END IF;
          
          -- Siempre respetar el valor de ticket proporcionado
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER respect_ticket_values
        BEFORE INSERT OR UPDATE ON transaction_lines
        FOR EACH ROW
        EXECUTE FUNCTION respect_ticket_values_func();
      `)

      console.log("Nuevo trigger creado correctamente.")

      // Confirmar transacción
      await sql`COMMIT`
      console.log("\n¡CAMBIOS APLICADOS CORRECTAMENTE!")
    } catch (error) {
      // Revertir transacción en caso de error
      await sql`ROLLBACK`
      console.error("Error al aplicar cambios:", error)
      throw error
    }

    // 4. Verificar los cambios realizados
    console.log("\n=== VERIFICANDO CAMBIOS ===")

    // 4.1 Verificar triggers activos
    const activeTriggersResult = await sql`
      SELECT trigger_name, event_manipulation
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines' AND trigger_enabled = 'YES'
      ORDER BY trigger_name
    `

    console.log("\nTriggers activos después de los cambios:")
    if (activeTriggersResult.rows.length > 0) {
      for (const trigger of activeTriggersResult.rows) {
        console.log(`- ${trigger.trigger_name} (${trigger.event_manipulation})`)
      }
    } else {
      console.log("No hay triggers activos en la tabla transaction_lines")
    }

    // 4.2 Verificar la definición de la columna ticket
    const newColumnDefResult = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket'
    `

    if (newColumnDefResult.rows.length > 0) {
      const columnDef = newColumnDefResult.rows[0]
      console.log("\nNueva definición de la columna ticket:")
      console.log(`Nombre: ${columnDef.column_name}`)
      console.log(`Tipo de datos: ${columnDef.data_type}`)
      console.log(`Valor por defecto: ${columnDef.column_default || "ninguno"}`)
      console.log(`Permite NULL: ${columnDef.is_nullable}`)
    }

    console.log("\n¡PROCESO COMPLETADO!")
    console.log("Ahora el sistema debería respetar los valores de ticket proporcionados al guardar.")
  } catch (error) {
    console.error("Error en el proceso:", error)
  }
}

disableTicketAutoincrement()
