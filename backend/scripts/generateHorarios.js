const pool = require("../src/config/db");
const horarioGeneratorService = require("../src/services/horarioGeneratorService");

const main = async () => {
  try {
    const result = await horarioGeneratorService.generarHorarios({ limpiar: true });
    console.log(`Horarios generados: ${result.totalHorarios}`);
    console.log(`Cursos procesados: ${result.totalCursos}`);
    console.log(
      result.validation.valid
        ? "Validacion: horario valido, sin conflictos."
        : `Validacion: ${result.validation.resumen.conflictos} conflicto(s).`
    );

    if (!result.validation.valid) {
      for (const conflict of result.validation.conflicts.slice(0, 10)) {
        console.log(`- ${conflict.message}`);
      }
    }
  } catch (error) {
    console.error(error.message || error);
    if (error.details?.length) {
      for (const detail of error.details) console.error(`- ${detail}`);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

main();
