import { sql } from "@vercel/postgres"
import { processObjectDates } from "./date-interceptor"

// Exportar sql para uso directo
export { sql }

// Función para ejecutar consultas SQL usando @vercel/postgres
export async function query(text: string, params: any[] = []) {
  try {
    const result = await sql.query(text, params)

    // Procesar las fechas en los resultados usando el interceptor global
    if (result.rows && result.rows.length > 0) {
      result.rows = result.rows.map((row) => processObjectDates(row))
    }

    return result
  } catch (error) {
    console.error(`Error ejecutando consulta: ${text}`, error)
    throw error
  }
}

// Función para obtener un solo registro
export async function getOne(text: string, params: any[] = []) {
  const result = await query(text, params)
  return result.rows[0]
}

// Función para obtener múltiples registros
export async function getMany(text: string, params: any[] = []) {
  const result = await query(text, params)
  return result.rows
}

// Función para insertar un registro
export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
  const columns = keys.join(", ")

  const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
  const result = await query(text, values)
  return result.rows[0]
}

// Función para actualizar un registro
export async function update(table: string, id: number | string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ")

  const text = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`
  const result = await query(text, [...values, id])
  return result.rows[0]
}

// Función para eliminar un registro
export async function remove(table: string, id: number | string) {
  const text = `DELETE FROM ${table} WHERE id = $1 RETURNING *`
  const result = await query(text, [id])
  return result.rows[0]
}

// Función para ejecutar una transacción
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  try {
    // Iniciar transacción
    await sql.query("BEGIN")

    // Ejecutar callback con el cliente sql
    const result = await callback(sql)

    // Confirmar transacción
    await sql.query("COMMIT")

    // Procesar fechas en el resultado
    return processObjectDates(result)
  } catch (error) {
    // Revertir transacción en caso de error
    await sql.query("ROLLBACK")
    console.error("Error en transacción:", error)
    throw error
  }
}

// Objeto db para compatibilidad con código existente
export const db = {
  query: async (text: string, values: any[] = []) => {
    const result = await query(text, values)
    return result.rows
  },
}
