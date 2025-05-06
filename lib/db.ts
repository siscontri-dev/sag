import { sql } from "@vercel/postgres"

export { sql }

export const db = {
  query: async (query: string, values: any[] = []) => {
    try {
      const result = await sql.query(query, values)
      return result.rows
    } catch (error) {
      console.error(`Error executing query: ${query}`, error)
      throw error
    }
  },
}
