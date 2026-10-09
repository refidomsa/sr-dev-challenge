// The same rules of the backend, checked in the form before sending,
// so the user sees the problem right away. The backend always checks again.

export const MINIMUM_GALLONS_PER_LINE = 500;
export const MAXIMUM_GALLONS_PER_ORDER = 9000;
export const MAXIMUM_LINES_PER_ORDER = 4;
const MINIMUM_HOURS_BEFORE_DELIVERY = 24;
const DOMINICAN_HOURS_BEHIND_UTC = 4;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const SUNDAY = 0;

export interface FormLine {
  productId: string;
  gallons: string;
}

export function toDeliveryDate(inputValue: string): Date {
  return new Date(`${inputValue}:00.000-04:00`);
}

export function validateOrder(
  lines: FormLine[],
  deliveryInput: string,
  totalCents: number,
  availableCreditCents: number | null,
): string[] {
  const problems: string[] = [];

  if (lines.length < 1 || lines.length > MAXIMUM_LINES_PER_ORDER) {
    problems.push('El pedido debe tener entre 1 y 4 líneas.');
  }

  const usedProducts: string[] = [];
  let hasRepeatedProduct = false;
  let hasLineWithoutProduct = false;
  for (const line of lines) {
    if (line.productId === '') {
      hasLineWithoutProduct = true;
    } else if (usedProducts.includes(line.productId)) {
      hasRepeatedProduct = true;
    } else {
      usedProducts.push(line.productId);
    }
  }
  if (hasLineWithoutProduct) {
    problems.push('Selecciona un producto en cada línea.');
  }
  if (hasRepeatedProduct) {
    problems.push('No se puede repetir un producto en el pedido.');
  }

  let totalGallons = 0;
  let hasInvalidGallons = false;
  let hasLineBelowMinimum = false;
  for (const line of lines) {
    const gallons = Number(line.gallons);
    if (line.gallons.trim() === '' || !Number.isInteger(gallons)) {
      hasInvalidGallons = true;
    } else {
      totalGallons = totalGallons + gallons;
      if (gallons < MINIMUM_GALLONS_PER_LINE) {
        hasLineBelowMinimum = true;
      }
    }
  }
  if (hasInvalidGallons) {
    problems.push('Los galones de cada línea deben ser un número entero.');
  }
  if (hasLineBelowMinimum) {
    problems.push('Cada línea debe tener al menos 500 galones.');
  }
  if (totalGallons > MAXIMUM_GALLONS_PER_ORDER) {
    problems.push('El pedido no puede superar los 9,000 galones.');
  }

  if (deliveryInput === '') {
    problems.push('Indica la fecha de entrega.');
  } else {
    const deliveryDate = toDeliveryDate(deliveryInput);

    const hoursUntilDelivery =
      (deliveryDate.getTime() - Date.now()) / MILLISECONDS_PER_HOUR;
    if (hoursUntilDelivery < MINIMUM_HOURS_BEFORE_DELIVERY) {
      problems.push('La fecha de entrega debe ser al menos 24 horas después de ahora.');
    }

    const deliveryInDominicanTime = new Date(
      deliveryDate.getTime() - DOMINICAN_HOURS_BEHIND_UTC * MILLISECONDS_PER_HOUR,
    );
    if (deliveryInDominicanTime.getUTCDay() === SUNDAY) {
      problems.push('La fecha de entrega no puede ser domingo.');
    }
  }

  if (availableCreditCents !== null && totalCents > availableCreditCents) {
    problems.push('El total del pedido supera el crédito disponible.');
  }

  return problems;
}
