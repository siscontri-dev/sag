// Función para convertir números a letras en español
export function NumeroALetras(numero: number): string {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
  const especiales = [
    "DIEZ",
    "ONCE",
    "DOCE",
    "TRECE",
    "CATORCE",
    "QUINCE",
    "DIECISEIS",
    "DIECISIETE",
    "DIECIOCHO",
    "DIECINUEVE",
  ]
  const centenas = [
    "",
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ]

  // Función para convertir números menores a 1000
  function convertirMenorMil(n: number): string {
    let resultado = ""

    // Centenas
    const centena = Math.floor(n / 100)
    if (centena > 0) {
      if (centena === 1 && n % 100 === 0) {
        return "CIEN"
      }
      resultado += centenas[centena] + " "
    }

    // Decenas y unidades
    const decena = Math.floor((n % 100) / 10)
    const unidad = n % 10

    if (decena === 1 && unidad > 0) {
      // Números del 11 al 19
      resultado += especiales[unidad] + " "
    } else {
      if (decena > 0) {
        resultado += decenas[decena]
        if (unidad > 0) {
          resultado += " Y "
        }
      }
      if (unidad > 0) {
        resultado += unidades[unidad] + " "
      }
    }

    return resultado.trim()
  }

  // Función principal
  function convertir(n: number): string {
    if (n === 0) return "CERO"

    let resultado = ""
    let esNegativo = false

    // Manejar números negativos
    if (n < 0) {
      esNegativo = true
      n = Math.abs(n)
    }

    // Separar parte entera y decimal
    const partes = n.toString().split(".")
    const entero = Number.parseInt(partes[0])
    const decimal = partes.length > 1 ? Number.parseInt(partes[1]) : 0

    // Convertir millones
    const millones = Math.floor(entero / 1000000)
    if (millones > 0) {
      if (millones === 1) {
        resultado += "UN MILLON "
      } else {
        resultado += convertirMenorMil(millones) + " MILLONES "
      }
    }

    // Convertir miles
    const miles = Math.floor((entero % 1000000) / 1000)
    if (miles > 0) {
      if (miles === 1) {
        resultado += "MIL "
      } else {
        resultado += convertirMenorMil(miles) + " MIL "
      }
    }

    // Convertir unidades
    const unidades = entero % 1000
    if (unidades > 0) {
      resultado += convertirMenorMil(unidades) + " "
    }

    // Añadir "PESOS"
    resultado += "PESOS"

    // Añadir parte decimal
    if (decimal > 0) {
      resultado += " CON " + decimal.toString().padEnd(2, "0") + "/100"
    } else {
      resultado += " CON 00/100"
    }

    // Añadir "MENOS" si es negativo
    if (esNegativo) {
      resultado = "MENOS " + resultado
    }

    return resultado
  }

  return convertir(numero)
}

export default NumeroALetras
