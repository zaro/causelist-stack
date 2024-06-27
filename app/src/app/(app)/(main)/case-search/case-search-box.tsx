import { useState } from "react";
import Input from "@mui/material/Input";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import BackspaceIcon from "@mui/icons-material/Backspace";
import InputAdornment from "@mui/material/InputAdornment";
import { useRouter } from "next/navigation";

export default function CaseSearchBox({
  initialSearchText,
  caseSearchPath,
}: {
  initialSearchText: string;
  caseSearchPath?: string;
}) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(initialSearchText);
  const search = () => {
    router.push(
      `${caseSearchPath ?? "/case-search"}/${encodeURIComponent(searchText)}`
    );
  };

  return (
    <Box display="flex" alignItems={"center"} justifyContent={"center"}>
      <Input
        placeholder="Search cases documents"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{ width: { md: "23em" } }}
        endAdornment={
          <InputAdornment position="end">
            <Button
              onClick={() => {
                setSearchText("");
              }}
            >
              <BackspaceIcon />
            </Button>
          </InputAdornment>
        }
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            search();
          }
        }}
      />
      <Button onClick={search}>
        <SearchIcon />
      </Button>
    </Box>
  );
}
