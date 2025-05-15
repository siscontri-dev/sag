import { InformeModelo } from "@/components/informe-modelo"

export default function RecaudoDiarioPage() {
  // Definir las columnas del informe sin funciones
  const columnas = [
    {
      id: "fecha",
      header: "Fecha",
      accessor: "Fecha",
      align: "left",
    },
    {
      id: "del",
      header: "Del (Primer Ticket ID)",
      accessor: "Del",
      align: "right",
      isNumeric: true,
    },
    {
      id: "al",
      header: "Al (Último Ticket ID)",
      accessor: "Al",
      align: "right",
      isNumeric: true,
    },
    {
      id: "tiquetes",
      header: "Tiquetes",
      accessor: "Tiquetes",
      align: "right",
      isNumeric: true,
      formatType: "number", // En lugar de pasar una función
    },
    {
      id: "machos",
      header: "Nº Machos",
      accessor: "Machos",
      align: "right",
      isNumeric: true,
      formatType: "number", // En lugar de pasar una función
    },
    {
      id: "hembras",
      header: "Nº Hembras",
      accessor: "Hembras",
      align: "right",
      isNumeric: true,
      formatType: "number", // En lugar de pasar una función
    },
    {
      id: "peso",
      header: "Peso (Kg)",
      accessor: "Peso",
      align: "right",
      isNumeric: true,
      formatType: "number", // En lugar de pasar una función
    },
    {
      id: "valorUnitario",
      header: "Valor Servicio Unitario",
      accessor: "ValorUnitario",
      align: "right",
      isNumeric: true,
      formatType: "number", // En lugar de pasar una función
    },
    {
      id: "totalValor",
      header: "Total Valor Servicio",
      accessor: "TotalValor",
      align: "right",
      isNumeric: true,
      formatType: "number", // En lugar de pasar una función
    },
  ]

  // Definir las opciones de exportación
  const opcionesExportacion = {
    tituloDocumento: "CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA",
    subtituloDocumento: "Recaudo Diario Acumulado",
    nombreArchivo: "recaudo_diario",
  }

  return (
    <div className="container mx-auto py-6">
      <InformeModelo
        titulo="Recaudo Diario Acumulado"
        endpoint="/api/informes/recaudo-diario"
        columnas={columnas}
        opcionesExportacion={opcionesExportacion}
        mostrarBusqueda={true}
        mostrarFiltroFecha={true}
        rutaInicio="/"
      />
    </div>
  )
}
