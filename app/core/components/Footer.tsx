import { Flex, Link, Stack, Text, VStack } from "@chakra-ui/react";
import { getSlideUpScrollVariants } from "../lib/scroll-variants";
import { CenteredView } from "./CenteredView";
import { ScrollAnimation } from "./ScrollAnimation";

export function Footer () {
  return (
    <VStack align="stretch" bgColor={"gray.200"}>
      <ScrollAnimation variants={getSlideUpScrollVariants({ delay: 0.3 })}>
        <CenteredView>
          <Stack direction={{ base: "column", lg: "row" }} spacing={2} align="flex-start" py={2} px={{ base: 4, lg: 0 }}>
            <Text fontSize="md">
              © 2022 BugTracker
            </Text>
            <Flex flexGrow={1} />
            <Text fontSize="md">
              Developed by <Link href="https://allansimoyi.com" color="teal.600">Allan Simoyi</Link>
            </Text>
          </Stack>
        </CenteredView>
      </ScrollAnimation>
    </VStack>
  )
}