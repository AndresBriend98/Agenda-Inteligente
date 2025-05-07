// Función para obtener la fecha y hora actual formateada
function getCurrentDateTime() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0];
  return {
    date,
    time,
    full: `${date} ${time}`
  };
}

// Función para procesar fechas relativas
function processRelativeDate(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  const cleanDate = dateStr.replace(/[^0-9-]/g, '');
  
  // Si es una fecha en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    const parsedDate = new Date(cleanDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Procesar fechas relativas
  const lowerDateStr = dateStr.toLowerCase();
  
  // Procesar "X de este mes"
  const thisMonthMatch = lowerDateStr.match(/(\d+)\s*de\s*este\s*mes/);
  if (thisMonthMatch) {
    const day = parseInt(thisMonthMatch[1]);
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    return date;
  }
  
  if (lowerDateStr.includes('mañana')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  if (lowerDateStr.includes('semana que viene') || lowerDateStr.includes('próxima semana')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  if (lowerDateStr.includes('mes que viene') || lowerDateStr.includes('próximo mes')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }
  
  // Procesar "en X días/semanas/meses"
  const daysMatch = lowerDateStr.match(/(\d+)\s*días?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate;
  }
  
  const weeksMatch = lowerDateStr.match(/(\d+)\s*semanas?/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (weeks * 7));
    return futureDate;
  }
  
  const monthsMatch = lowerDateStr.match(/(\d+)\s*meses?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + months);
    return futureDate;
  }

  return null;
}

module.exports = {
  getCurrentDateTime,
  processRelativeDate
}; 