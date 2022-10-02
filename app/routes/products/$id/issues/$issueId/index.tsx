import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink, Heading, HStack, Spacer, Stack, Tag, TagLabel, TagLeftIcon, Text, VStack
} from '@chakra-ui/react';
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useCatch, useFetcher, useLoaderData, useNavigate, useTransition } from "@remix-run/react";
import { redirect } from "@remix-run/server-runtime";
import { useCallback } from "react";
import { Check, ChevronRight, Focus } from "tabler-icons-react";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import { DeleteConfirmation } from "~/core/components/DeleteConfirmation";
import { PrimaryButton } from "~/core/components/PrimaryButton";
import { useDelete } from "~/core/hooks/useDelete";
import type { inferSafeParseErrors } from "~/core/validations";
import { badRequest, PositiveIntSchema } from "~/core/validations";
import { CLOSED_ISSUE, OPEN_ISSUE } from "~/issues/lib/issues";

import dayjs from "dayjs";
import { z } from 'zod';
import { CommentListItem } from "~/comments/components/CommentListItem";
import { ActionContextProvider } from '~/core/components/ActionContextProvider';
import { CustomTextArea } from '~/core/components/CustomTextArea';
import { OutlinedButton } from '~/core/components/OutlinedButton';
import { prisma } from "~/db.server";
import { requireUser } from "~/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Bug Tracker - Issue",
  };
};

async function fetchProduct (productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    throw new Response("Product record not found", { status: 404 });
  }
  return product;
}

async function fetchIssue (issueId: number) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { comments: { include: { user: true } } },
  });
  if (!issue) {
    throw new Response("Issue record not found", { status: 404 });
  }
  return issue;
}

interface LoaderData {
  product: Awaited<ReturnType<typeof fetchProduct>>;
  issue: Awaited<ReturnType<typeof fetchIssue>>;
}

export async function loader ({ request, params }: LoaderArgs) {
  await requireUser(request);

  const idResult = await PositiveIntSchema.safeParseAsync(params.id);
  if (!idResult.success) {
    throw new Error("Invalid product ID");
  }
  const productId = idResult.data;

  const issueIdResult = await PositiveIntSchema.safeParseAsync(params.issueId);
  if (!issueIdResult.success) {
    throw new Error("Invalid issue ID");
  }
  const issueId = issueIdResult.data;

  const [product, issue] = await Promise.all([
    fetchProduct(productId),
    fetchIssue(issueId),
  ]);

  return json({ product, issue });
}

const Schema = z.object({
  comment: z.string().min(1).max(800),
});

type Fields = z.infer<typeof Schema>;
type FieldErrors = inferSafeParseErrors<typeof Schema>;
type ActionData = {
  formError?: string
  fields?: Fields
  fieldErrors?: FieldErrors,
  issue: LoaderData["issue"],
};

export async function action ({ request, params }: ActionArgs) {
  const currentUser = await requireUser(request);

  const idResult = await PositiveIntSchema.safeParseAsync(params.id);
  if (!idResult.success) {
    throw new Error("Invalid product ID");
  }
  const productId = idResult.data;

  const issueIdResult = await PositiveIntSchema.safeParseAsync(params.issueId);
  if (!issueIdResult.success) {
    throw new Error("Invalid issue ID");
  }
  const issueId = issueIdResult.data;

  const form = await request.formData();
  const fields = Object.fromEntries(form.entries());

  if (form.get("_method") === "delete") {
    await prisma.$transaction([
      prisma.issue.delete({ where: { id: issueId } }),
      prisma.comment.deleteMany({ where: { issueId } }),
    ]);
    return redirect(`/products/${ productId }`);
  }

  if (form.get("_method") === "close") {
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { state: CLOSED_ISSUE },
    });
    return json({ issue });
  }

  if (form.get("_method") === "open") {
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { state: OPEN_ISSUE },
    });
    return json({ issue });
  }

  const result = await Schema.safeParseAsync(fields);
  if (!result.success) {
    const { formErrors, fieldErrors } = result.error.flatten();
    return badRequest({ fields, fieldErrors, formError: formErrors.join(", ") });
  }
  const { comment } = result.data;

  await prisma.comment.create({
    data: {
      userId: currentUser.id,
      issueId,
      content: comment,
    }
  });

  const issue = await fetchIssue(issueId);
  return json({ issue });
}

export default function ProductPage () {
  const { product, issue } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();

  const transition = useTransition();
  const isSubmitting = transition.state === "submitting";

  const {
    confirmDeleteIsOpen, handleDeleteSubmit,
    onConfirmDelete, onCloseConfirmDelete, cancelDeleteRef
  } = useDelete();

  const customKey = issue.comments.map(comment => comment.id).join("");

  const relevantIssue = fetcher.data?.issue || issue;

  return (
    <VStack key={customKey} align="stretch" px={4} py={8}>
      <DeleteConfirmation
        identifier="Lender"
        isOpen={confirmDeleteIsOpen}
        isDeleting={isSubmitting}
        onConfirm={onConfirmDelete}
        onCancel={onCloseConfirmDelete}
        cancelRef={cancelDeleteRef}
      />
      <VStack align="stretch" spacing={8}>
        <Stack direction={{ base: "column", lg: "row" }} align={{ base: "flex-start", lg: "flex-start" }} spacing={4}>
          <VStack align="flex-start">
            <Breadcrumb spacing='8px' separator={<ChevronRight color='white' />}>
              <BreadcrumbItem color="teal.400">
                <BreadcrumbLink as={Link} to="/products">
                  Products
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem color="teal.400">
                <BreadcrumbLink as={Link} to={`/products/${ product.id }`}>
                  {product.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem color="white" isCurrentPage>
                <Text>{relevantIssue.title}</Text>
              </BreadcrumbItem>
            </Breadcrumb>
            <HStack align="center">
              {relevantIssue.state === OPEN_ISSUE && (
                <Tag size={"sm"} variant="outline" colorScheme='teal'>
                  <TagLeftIcon boxSize='12px' as={Focus} />
                  <TagLabel>Open</TagLabel>
                </Tag>
              )}
              {relevantIssue.state === CLOSED_ISSUE && (
                <Tag size={"sm"} variant="outline" colorScheme='gray'>
                  <TagLeftIcon boxSize='12px' as={Check} />
                  <TagLabel>Closed</TagLabel>
                </Tag>
              )}
              <Text fontSize="sm" color="whiteAlpha.800">
                Created {dayjs(relevantIssue.createdAt).fromNow()} &middot; {relevantIssue.comments.length} comment(s)
              </Text>
            </HStack>
            <VStack align="stretch" pt={4}>
              <Text fontSize="sm" color="whiteAlpha.800">
                {relevantIssue.description}
              </Text>
            </VStack>
          </VStack>
          <Spacer />
          {issue.state === OPEN_ISSUE && (
            <Form method="post">
              <input type="hidden" name="_method" value="close" />
              <OutlinedButton colorScheme="purple" type="submit" leftIcon={<Check />} isDisabled={isSubmitting}>
                Close Issue
              </OutlinedButton>
            </Form>
          )}
          {issue.state === CLOSED_ISSUE && (
            <Form method="post">
              <input type="hidden" name="_method" value="open" />
              <OutlinedButton type="submit" leftIcon={<Focus />} isDisabled={isSubmitting}>
                Open Issue
              </OutlinedButton>
            </Form>
          )}
          <Link to={`/products/${ product.id }/issues/${ relevantIssue.id }/edit`}>
            <PrimaryButton isDisabled={isSubmitting}>
              Edit Issue
            </PrimaryButton>
          </Link>
          <Form onSubmit={handleDeleteSubmit} method="post">
            <input type="hidden" name="_method" value="delete" />
            <PrimaryButton type="submit" colorScheme="red" w="100%" isDisabled={isSubmitting}>
              Delete Issue
            </PrimaryButton>
          </Form>
        </Stack>
        <VStack align="stretch" border="1px" spacing={2} borderRadius={5} borderColor="whiteAlpha.400">
          <VStack align="stretch" bgColor="whiteAlpha.50" p={4}>
            <Heading role="heading" size="md" color="white">
              Comments
            </Heading>
          </VStack>
          {!relevantIssue.comments.length && (
            <VStack align="stretch" p={4}>
              <Text fontSize="md" color="white">
                No messages found
              </Text>
            </VStack>
          )}
          {relevantIssue.comments.length && (
            <VStack align="stretch">
              {relevantIssue.comments.map(comment => (
                <CommentListItem
                  key={comment.id}
                  username={comment.user.username}
                  comment={comment.content}
                  createdAt={new Date(comment.createdAt)}
                />
              ))}
            </VStack>
          )}
        </VStack>
        <VStack align="stretch">
          <fetcher.Form method="post">
            <ActionContextProvider
              fields={fetcher.data?.fields}
              fieldErrors={fetcher.data?.fieldErrors}
              formError={fetcher.data?.formError}
              isSubmitting={isSubmitting}
            >
              <CustomTextArea
                formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                bg="blackAlpha.50"
                color="white"
                name="comment"
                label="Write"
                placeholder="Leave a comment"
              />
              <VStack align="flex-end" py={2}>
                <PrimaryButton type="submit" isDisabled={isSubmitting}>
                  {isSubmitting ? "PROCESSING..." : "LEAVE COMMENT"}
                </PrimaryButton>
              </VStack>
            </ActionContextProvider>
          </fetcher.Form>
        </VStack>
      </VStack>
    </VStack>
  );
}

export function CatchBoundary () {
  const caught = useCatch();
  const navigate = useNavigate();
  const reload = useCallback(() => {
    navigate('.', { replace: true })
  }, [navigate]);
  return <CustomCatchBoundary reload={reload} caught={caught} />
}

export function ErrorBoundary ({ error }: { error: Error }) {
  console.error(error);
  const navigate = useNavigate();
  const reload = useCallback(() => {
    navigate('.', { replace: true })
  }, [navigate]);
  return <CustomErrorBoundary reload={reload} error={error} />
}