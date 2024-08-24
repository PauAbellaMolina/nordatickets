export function formatDateInput(input: string): string {
  // Remove any non-digit characters
  const cleaned = input.replace(/\D/g, '');
  
  // Add slashes as the user types
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
}

export function isValidDate(dateString: string): boolean {
  // Check if the format is correct
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);

  // Check year
  if (year < 1000 || year > 9999) return false;

  // Check month
  if (month < 1 || month > 12) return false;

  // Check day
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}