import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Obtener el valor de ticket de la URL
  const { searchParams } = new URL(request.url)
  const ticketValue = searchParams.get("ticket")

  if (!ticketValue) {
    return NextResponse.json(
      {
        success: false,
        message: "Debes proporcionar un valor para el ticket en la URL (?ticket=123)",
      },
      { status: 400 },
    )
  }

  try {
    // Iniciar una transacción
    await sql`BEGIN`

    // Crear una transacción temporal para la prueba
    const transactionResult = await sql`
      INSERT INTO transactions (
        numero_documento,
        fecha_documento,
        id_dueno_anterior,
        id_dueno_nuevo,
        business_location_id,
        total,
        estado,
        type,
        usuario_id
      ) VALUES (
        'TEST-${Date.now()}',
        CURRENT_DATE,
        1,
        1,
        1,
        0,
        'borrador',
        'test',
        1
      )
      RETURNING id
    `

    const transactionId = transactionResult.rows[0].id

    // Insertar una línea con el valor de ticket proporcionado
    const lineResult = await sql`
      INSERT INTO transaction_lines (
        transaction_id,
        ticket,
        product_id,
        quantity,
        valor
      ) VALUES (
        ${transactionId},
        ${Number.parseInt(ticketValue)},
        1,
        1,
        0
      )
      RETURNING id, ticket, ticket2
    `

    // Verificar el valor insertado
    const verifyResult = await sql`
      SELECT id, ticket, ticket2
      FROM transaction_lines
      WHERE id = ${lineResult.rows[0].id}
    `

    // Limpiar la prueba
    await sql`DELETE FROM transaction_lines WHERE transaction_id = ${transactionId}`
    await sql`DELETE FROM transactions WHERE id = ${transactionId}`

    // Confirmar la transacción
    await sql`COMMIT`

    return NextResponse.json({
      success: true,
      message: "Prueba de inserción completada",
      data: {
        valor_proporcionado: Number.parseInt(ticketValue),
        valor_insertado: lineResult.rows[0],
        valor_verificado: verifyResult.rows[0],
        resultado:
          verifyResult.rows[0].ticket === Number.parseInt(ticketValue)
            ? "ÉXITO: El valor se guardó correctamente"
            : "ERROR: El valor fue modificado",
      },
    })
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`

    console.error("Error en la prueba de inserción:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error en la prueba de inserción: ${error.message}`,
        error: error.stack,
      },
      { status: 500 },
    )
  }
}
