import { Heading, Img, Stack, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { CenteredView } from "~/core/components/CenteredView";
import { Footer } from "~/core/components/Footer";

interface Props {
  children: React.ReactNode;
}

export function Hero ({ children }: Props) {
  return (
    <VStack align="stretch" spacing={0}>
      <VStack align="stretch" minHeight="100vh">
        <CenteredView flexGrow={1}>
          <Stack direction={{ base: "column", lg: "row" }} justify={{ base: "center", lg: "flex-start" }} align="center" p={4} spacing={8} flexGrow={1}>
            <VStack spacing={8} width={{ base: "100%", lg: "60%" }} align={{ base: "center", lg: "flex-start" }} py={[4, 8]}>
              <Wrap justify="center" align="flex-start">
                <WrapItem>
                  <Img boxSize="20" objectFit="contain" src="/logo.png" alt="Bug Tracker" />
                </WrapItem>
                <WrapItem>
                  <Heading size="4xl" color={"white"} as="h1" textAlign={{ base: "center", lg: "start" }}>
                    BUG TRACKER
                  </Heading>
                </WrapItem>
              </Wrap>
              <Text color={"white"} fontSize="lg" textAlign={{ base: "center", lg: "start" }}>
                Identify issues with products, work with others to resolve them <br />
                and track their progress.
              </Text>
            </VStack>
            <VStack width={{ base: "100%", lg: "40%" }} align="stretch">
              {children}
            </VStack>
          </Stack>
        </CenteredView>
      </VStack>
      <Footer />
    </VStack >
  )
}