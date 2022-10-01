import { HStack, Text, VStack } from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import dayjs from "dayjs";
import { Check, Focus } from "tabler-icons-react";
import { PrimaryButton } from "~/core/components/PrimaryButton";
import relativeTime from "dayjs/plugin/relativeTime"
import { CLOSED_ISSUE, OPEN_ISSUE } from "../lib/issues";

dayjs.extend(relativeTime);

interface Props {
  id: number;
  state: string;
  title: string;
  createdAt: Date;
  numComments: number;
}

export function IssueListItem (props: Props) {
  const { id, state, title, createdAt, numComments } = props;
  return (
    <VStack align="flex-start" p={4}>
      <HStack align="center">
        {state === OPEN_ISSUE && (
          <Focus color="teal" />
        )}
        {state === CLOSED_ISSUE && (
          <Check color="gray" />
        )}
        <Link to={`/products/${ id }`}>
          <PrimaryButton size="lg" variant="link" color="white">
            {title}
          </PrimaryButton>
        </Link>
      </HStack>
      <Text fontSize="sm" color="whiteAlpha.800">
        Created {dayjs(createdAt).fromNow()} &middot; {numComments} comments
      </Text>
    </VStack>
  )
}