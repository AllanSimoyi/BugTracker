import { Text, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Props {
  username: string;
  comment: string;
  createdAt: Date;
}

export function CommentListItem (props: Props) {
  const { username, comment, createdAt } = props;
  return (
    <VStack align="flex-start" p={4}>
      <Text fontSize="md" color="white" fontWeight="semibold">
        {comment}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.600">
        {username} commented {dayjs(createdAt).fromNow()}
      </Text>
    </VStack>
  )
}