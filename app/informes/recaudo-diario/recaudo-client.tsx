"use client"

import { InformeModelo } from "@/components/informe-modelo"

export default function RecaudoClient() {
  // Definir las columnas del informe
  const columnas = [
    {
      id: "fecha",
      header: "Fecha",
      accessor: "Fecha",
      align: "left" as const,
    },
    {
      id: "del",
      header: "Del (Primer Ticket ID)",
      accessor: "Del",
      align: "right" as const,
      isNumeric: true,
    },
    {
      id: "al",
      header: "Al (Último Ticket ID)",
      accessor: "Al",
      align: "right" as const,
      isNumeric: true,
    },
    {
      id: "tiquetes",
      header: "Tiquetes",
      accessor: "Tiquetes",
      align: "right" as const,
      isNumeric: true,
      format: (value: number) => value.toLocaleString(),
    },
    {
      id: "machos",
      header: "Nº Machos",
      accessor: "Machos",
      align: "right" as const,
      isNumeric: true,
      format: (value: number) => value.toLocaleString(),
    },
    {
      id: "hembras",
      header: "Nº Hembras",
      accessor: "Hembras",
      align: "right" as const,
      isNumeric: true,
      format: (value: number) => value.toLocaleString(),
    },
    {
      id: "peso",
      header: "Peso (Kg)",
      accessor: "Peso",
      align: "right" as const,
      isNumeric: true,
      format: (value: number) => value.toLocaleString(),
    },
    {
      id: "valorUnitario",
      header: "Valor Servicio Unitario",
      accessor: "ValorUnitario",
      align: "right" as const,
      isNumeric: true,
      format: (value: number) => value.toLocaleString(),
    },
    {
      id: "totalValor",
      header: "Total Valor Servicio",
      accessor: "TotalValor",
      align: "right" as const,
      isNumeric: true,
      format: (value: number) => value.toLocaleString(),
    },
  ]

  // Definir las opciones de exportación
  const opcionesExportacion = {
    tituloDocumento: "CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA",
    subtituloDocumento: "Recaudo Diario Acumulado",
    nombreArchivo: "recaudo_diario",
  }

  return (
    <InformeModelo
      titulo="Recaudo Diario Acumulado"
      endpoint="/api/informes/recaudo-diario"
      columnas={columnas}
      opcionesExportacion={opcionesExportacion}
      mostrarBusqueda={true}
      mostrarFiltroFecha={true}
      rutaInicio="/"
    />
  )
}
