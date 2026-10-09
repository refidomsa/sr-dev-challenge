// Shows an error and, when the backend sends them, the detail of each invalid field.
export function ErrorMessage({
  message,
  details,
}: {
  message: string | null;
  details?: string[];
}) {
  if (message === null) {
    return null;
  }

  return (
    <div className="alert error" role="alert">
      <p>{message}</p>
      {details !== undefined && details.length > 0 && (
        <ul>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
