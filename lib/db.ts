import { sql } from "@vercel/postgres"

export { sql }

export const db = {
  query: async (query: string, values: any[] = []) => {
    try {
      const result = await sql.query(query, values)
      return result.rows
    } catch (error) {
      console.error(`Error executing query: ${query}`, error)
      // Registrar más detalles sobre el error
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`)
        console.error(`Error stack: ${error.stack}`)
      }
      throw error
    }
  },
}
