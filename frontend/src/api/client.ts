// The only file that talks to the backend with fetch.

const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// What the backend answers when something fails (RFC 9457, Problem Details).
interface ProblemDetails {
  status: number;
  detail: string;
  code: string;
  errors?: string[];
}

// Messages in Spanish for the errors of the backend, by their code.
const MESSAGE_BY_CODE: Record<string, string> = {
  INVALID_CREDENTIALS: 'El correo o la contraseña no son correctos.',
  FORBIDDEN_ACTION: 'Tu usuario no tiene permiso para hacer esto.',
  ORDER_NOT_FOUND: 'El pedido no existe.',
  DISTRIBUTOR_NOT_FOUND: 'El distribuidor no existe.',
  PRODUCT_NOT_FOUND: 'El producto no existe.',
  INVALID_TRANSITION:
    'El pedido ya cambió de estado y no admite esta acción. Actualiza la página.',
  INSUFFICIENT_CREDIT: 'El total del pedido supera el crédito disponible.',
  INVALID_LINE_COUNT: 'El pedido debe tener entre 1 y 4 líneas.',
  DUPLICATE_PRODUCT: 'No se puede repetir un producto en el pedido.',
  MINIMUM_GALLONS_NOT_MET: 'Cada línea debe tener al menos 500 galones.',
  MAXIMUM_GALLONS_EXCEEDED: 'El pedido no puede superar los 9,000 galones.',
  INVALID_GALLONS: 'Los galones deben ser un número entero.',
  DELIVERY_TOO_SOON:
    'La fecha de entrega debe ser al menos 24 horas después de crear el pedido.',
  SUNDAY_DELIVERY: 'La fecha de entrega no puede ser domingo.',
  REJECTION_REASON_REQUIRED: 'Debes escribir el motivo del rechazo.',
  VALIDATION_ERROR: 'Hay datos inválidos en el formulario.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado en el servidor.',
};

// The error every page receives when a request fails.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: string[];

  constructor(status: number, code: string, message: string, fieldErrors: string[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

// The pages use this to show any error as text.
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

// Called when the backend answers 401 with a token: the session expired.
let onSessionExpired: () => void = () => {};

export function setOnSessionExpired(handler: () => void): void {
  onSessionExpired = handler;
}

export async function request<T>(
  method: string,
  path: string,
  token: string | null,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token !== null) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'No se pudo conectar con el servidor. Verifica que el backend esté encendido.',
      [],
    );
  }

  if (response.ok) {
    return (await response.json()) as T;
  }

  // The request failed: read the Problem Details of the backend
  let problem: ProblemDetails | null = null;
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    problem = null;
  }

  const sessionExpired = response.status === 401 && token !== null;
  if (sessionExpired) {
    onSessionExpired();
  }

  if (problem === null) {
    throw new ApiError(response.status, 'UNKNOWN', 'Ocurrió un error inesperado.', []);
  }

  const message = MESSAGE_BY_CODE[problem.code] ?? problem.detail;
  throw new ApiError(response.status, problem.code, message, problem.errors ?? []);
}
