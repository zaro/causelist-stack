import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

export default function ErrorBox({
  error,
}: {
  error?: string | string[] | null;
}) {
  if (!error) return null;
  if (!Array.isArray(error)) {
    error = [error];
  }
  return (
    <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
      <AlertTitle>Error</AlertTitle>
      <ul>
        {error.map((e, idx) => (
          <li key={idx}>{e}</li>
        ))}
      </ul>
    </Alert>
  );
}
