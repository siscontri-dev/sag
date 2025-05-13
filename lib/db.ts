import { Pool } from "@vercel/postgres"
import { forceDateDMY } from "./date-utils"

// Crear un pool de conexiones a la base de datos
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

// Función para ejecutar consultas SQL
export async function query(text: string, params: any[] = []) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)

    // Procesar las fechas en los resultados
    if (result.rows && result.rows.length > 0) {
      result.rows = result.rows.map((row) => {
        const processedRow = { ...row }

        // Buscar campos que puedan contener fechas
        for (const key in processedRow) {
          // Si el nombre del campo sugiere que es una fecha
          if (
            key.includes("fecha") ||
            key.includes("date") ||
            key.includes("created_at") ||
            key.includes("updated_at")
          ) {
            // Aplicar el formato de fecha forzado
            if (processedRow[key]) {
              const formattedDate = forceDateDMY(processedRow[key])
              // Asegurarse de que el resultado sea siempre un string
              processedRow[key] = typeof formattedDate === "string" ? formattedDate : String(formattedDate)
            }
          }
        }

        return processedRow
      })
    }

    return result
  } finally {
    client.release()
  }
}

// Función para ejecutar una transacción
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

// Función para obtener un solo registro
export async function getOne(text: string, params: any[] = []) {
  const { rows } = await query(text, params)
  return rows[0]
}

// Función para obtener múltiples registros
export async function getMany(text: string, params: any[] = []) {
  const { rows } = await query(text, params)
  return rows
}

// Función para insertar un registro
export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
  const columns = keys.join(", ")

  const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
  const { rows } = await query(text, values)
  return rows[0]
}

// Función para actualizar un registro
export async function update(table: string, id: number | string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ")

  const text = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`
  const { rows } = await query(text, [...values, id])
  return rows[0]
}

// Función para eliminar un registro
export async function remove(table: string, id: number | string) {
  const text = `DELETE FROM ${table} WHERE id = $1 RETURNING *`
  const { rows } = await query(text, [id])
  return rows[0]
}

// Exportar el pool para uso directo si es necesario
export { pool }
