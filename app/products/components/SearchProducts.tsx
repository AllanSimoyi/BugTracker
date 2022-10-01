import { Stack } from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import { TextField } from "~/core/components/CustomTextField";
import { PrimaryButton } from "~/core/components/PrimaryButton";

interface Props {
  isProcessing: boolean;
}

export function SearchProducts ({ isProcessing }: Props) {
  return (
    <Stack
      direction={{ base: "column", lg: "row" }}
      justify={{ base: "center", lg: "flex-start" }}
      align={{ base: "flex-end", lg: "center" }}
      p={4} spacing={4}>
      <TextField
        color="white"
        flexGrow={1}
        name="searchTerms"
        label=""
        placeholder="Find a product..."
        isDisabled={isProcessing}
      />
      <Link to="/products/new">
        <PrimaryButton>
          New Product
        </PrimaryButton>
      </Link>
    </Stack>
  )
}