import type { ButtonProps } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react"

interface Props extends ButtonProps {}

export function PrimaryButton(props: Props) {
  return (
    <Button colorScheme="teal" {...props}>
      {props.children}
    </Button>
  )
}
