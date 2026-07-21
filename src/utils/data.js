// "Hoje" no fuso de Brasília (fixo, sem horário de verão), no formato YYYY-MM-DD.
// new Date().toISOString() converte para UTC — depois das 21h no Brasil, o dia em UTC
// já virou o seguinte, fazendo "hoje" mostrar a data de amanhã.
export const hojeBrasil = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
