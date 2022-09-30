import { Text, VStack } from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import { PrimaryButton } from "~/core/components/PrimaryButton";

interface Props {
  id: number;
  name: string;
  description: string;
}

export function ProductListItem ({ id, name, description }: Props) {
  return (
    <VStack align="flex-start" py={2}>
      <Link to={`/products/${ id }`}>
        <PrimaryButton size="lg" variant="link">
          {name}
        </PrimaryButton>
        <Text fontSize="sm" color="white">
          {description}
        </Text>
      </Link>
    </VStack>
  )
}