import { Heading, HStack, Image, Spacer, Stack, Text, VStack } from "@chakra-ui/react";
import { Form, Link } from "@remix-run/react";
import type { CurrentUser } from "~/auth/validations";
import { CenteredView } from "./CenteredView";
import { OutlinedButton } from "./OutlinedButton";

interface Props {
  currentUser: CurrentUser | undefined;
}

export function Toolbar (props: Props) {
  const { currentUser } = props;
  return (
    <VStack bgColor={"whiteAlpha.50"} align={"stretch"} boxShadow="md">
      <CenteredView>
        <Stack direction={{ base: "column", lg: "row" }} align="center" p={4}>
          <HStack align="center" spacing={4}>
            <Link to="/">
              <Image objectFit='contain' height={12} src="/logo.png" alt='Logo' />
            </Link>
            <Link to="/">
              <Heading color="white" size="lg" fontWeight="bold">
                BUG TRACKER
              </Heading>
            </Link>
          </HStack>
          <Spacer />
          {currentUser && (
            <HStack p={0} justify="flex-end" align="center">
              <Text color="white" fontSize="md" px="4" noOfLines={1}>
                {currentUser.username}
              </Text>
              <Form action="/logout" method="post">
                <OutlinedButton size="sm" type="submit" w="100%" colorScheme="whiteAlpha">
                  Log Out
                </OutlinedButton>
              </Form>
            </HStack>
          )}
        </Stack>
      </CenteredView>
    </VStack>
  )
}