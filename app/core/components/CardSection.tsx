import type { StackProps } from "@chakra-ui/react";
import { VStack } from "@chakra-ui/react"

interface Props extends StackProps {
  children: React.ReactNode
  noBottomBorder?: boolean
}

export function CardSection (props: Props) {
  const { children, ...rest } = props
  return (
    <VStack
      p={rest.p || 4}
      justify="center"
      align="stretch"
      {...rest}
    >
      {children}
    </VStack>
  )
}
