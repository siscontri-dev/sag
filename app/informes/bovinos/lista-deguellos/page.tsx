import { formatDateDMY } from "@/lib/date-utils"

// This is a placeholder page. You should replace this with the actual implementation.
// The updates indicate that you need to ensure the correct date formatting function is used.
// This example assumes you will be displaying a table of "deguellos" (slaughter records)
// with a "fecha_documento" (document date) field.

const ListaDeguellosPage = () => {
  // Dummy data for demonstration purposes
  const deguellos = [
    { id: 1, fecha_documento: new Date(), animal: "Cow 1" },
    { id: 2, fecha_documento: new Date("2024-01-15"), animal: "Cow 2" },
  ]

  return (
    <div>
      <h1>Lista de Deguellos</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha Documento</th>
            <th>Animal</th>
          </tr>
        </thead>
        <tbody>
          {deguellos.map((deguello) => (
            <tr key={deguello.id}>
              <td>{deguello.id}</td>
              <td>{formatDateDMY(deguello.fecha_documento)}</td>
              <td>{deguello.animal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ListaDeguellosPage
