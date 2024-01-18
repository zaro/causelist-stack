import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

export default function ErrorBox({
  error,
}: {
  error?: string | string[] | null;
}) {
  if (!error || !error.length) return null;
  if (!Array.isArray(error)) {
    error = [error];
  }
  return (
    <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
      <AlertTitle>Error</AlertTitle>
      <ul>
        {error.map((e, idx) => (
          <li key={idx}>{e.toString()}</li>
        ))}
      </ul>
    </Alert>
  );
}
