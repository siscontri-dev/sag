// Este script desactiva temporalmente todos los triggers en la tabla transaction_lines
// Ejecutar con: node disable-transaction-triggers.js

import { sql } from "@vercel/postgres"

async function disableTransactionTriggers() {
  try {
    console.log("Desactivando triggers en la tabla transaction_lines...")

    // Iniciar una transacción
    await sql`BEGIN`

    // Desactivar todos los triggers en la tabla transaction_lines
    await sql`
      ALTER TABLE transaction_lines DISABLE TRIGGER ALL;
    `

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Triggers desactivados con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al desactivar triggers:", error)
  } finally {
    process.exit(0)
  }
}

disableTransactionTriggers()
