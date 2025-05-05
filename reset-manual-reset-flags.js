import { resetManualResetFlag } from "./lib/ticket-manager"

async function resetFlags() {
  try {
    console.log("Iniciando reinicio de flags de reinicio manual...")

    const success = await resetManualResetFlag()

    if (success) {
      console.log("Flags de reinicio manual reiniciados correctamente")
    } else {
      console.error("Error al reiniciar flags de reinicio manual")
    }
  } catch (error) {
    console.error("Error en el proceso de reinicio de flags:", error)
  }
}

resetFlags()
