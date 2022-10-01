import { Heading, HStack, Spacer, Stack, Text, VStack } from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useCatch, useLoaderData, useNavigate, useTransition } from "@remix-run/react";
import { redirect } from "@remix-run/server-runtime";
import { useCallback } from "react";
import { Check, Focus } from "tabler-icons-react";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import { DeleteConfirmation } from "~/core/components/DeleteConfirmation";
import { OutlinedButton } from "~/core/components/OutlinedButton";
import { PrimaryButton } from "~/core/components/PrimaryButton";
import { ScrollAnimation } from "~/core/components/ScrollAnimation";
import { useDelete } from "~/core/hooks/useDelete";
import { getSlideUpScrollVariants } from "~/core/lib/scroll-variants";
import { PositiveIntSchema } from "~/core/validations";
import { CLOSED_ISSUE, OPEN_ISSUE } from "~/issues/lib/issues";

import { z } from "zod";
import { prisma } from "~/db.server";
import { IssueListItem } from "~/issues/components/IssueListItem";
import { requireUser } from "~/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Bug Tracker - Product Details",
  };
};

const Schema = z.object({
  state: z.string().optional(),
});

export async function loader ({ request, params }: LoaderArgs) {
  await requireUser(request);

  const result = await PositiveIntSchema.safeParseAsync(params.id);
  if (!result.success) {
    throw new Response("Invalid product ID", { status: 400 });
  }
  const id = result.data;

  const url = new URL(request.url);
  const rawState = url.searchParams.get("state") || undefined;

  const filterResult = await Schema.safeParseAsync({ state: rawState });
  if (!filterResult.success) {
    throw new Response("Invalid input, please reload the page", { status: 400 });
  }
  const input = filterResult.data;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { issues: { include: { comments: true } } },
  });

  if (!product) {
    throw new Response("Product record not found", { status: 404 });
  }

  const refinedProduct = input.state ?
    { ...product, issues: product.issues.filter(issue => issue.state === input.state) } :
    product;

  const numOpenIssues = product.issues.filter(issue => issue.state === OPEN_ISSUE).length;
  const numClosedIssues = product.issues.filter(issue => issue.state === CLOSED_ISSUE).length;

  return json({
    product: refinedProduct,
    issueState: input.state,
    numOpenIssues,
    numClosedIssues,
  });
}

export async function action ({ request, params }: ActionArgs) {
  await requireUser(request);

  const result = await PositiveIntSchema.safeParseAsync(params.id);
  if (!result.success) {
    throw new Error("Invalid product ID");
  }
  const id = result.data;

  const form = await request.formData();
  if (form.get("_method") !== "delete") {
    throw new Response(
      `The _method ${ form.get("_method") } is not supported`,
      { status: 400 }
    );
  }

  await prisma.product.delete({ where: { id } });

  return redirect("/products");
}

export default function ProductPage () {
  const { product, issueState, numOpenIssues, numClosedIssues } = useLoaderData<typeof loader>();

  const transition = useTransition();
  const isSubmitting = transition.state === "submitting";

  const {
    confirmDeleteIsOpen, handleDeleteSubmit,
    onConfirmDelete, onCloseConfirmDelete, cancelDeleteRef
  } = useDelete();

  const customKey = product.issues.map(issue => issue.id).join("");

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
        <Stack direction={{ base: "column", lg: "row" }} align={{ base: "flex-start", lg: "center" }} spacing={4}>
          <VStack align="flex-start">
            <Heading role="heading" size="md" color="white">
              {product.name}
            </Heading>
            <Text fontSize="sm" color="white">
              {product.description}
            </Text>
          </VStack>
          <Spacer />
          <Link to={`/products/${ product.id }/issues/new`}>
            <OutlinedButton isDisabled={isSubmitting} colorScheme="whiteAlpha">
              Record Issue
            </OutlinedButton>
          </Link>
          <Link to={`/products/${ product.id }/edit`}>
            <PrimaryButton isDisabled={isSubmitting}>
              Edit Product
            </PrimaryButton>
          </Link>
          <Form onSubmit={handleDeleteSubmit} method="post">
            <input type="hidden" name="_method" value="delete" />
            <PrimaryButton type="submit" colorScheme="red" w="100%" isDisabled={isSubmitting}>
              Delete Product
            </PrimaryButton>
          </Form>
        </Stack>
        <ScrollAnimation variants={getSlideUpScrollVariants({ delay: 0.1 })}>
          <VStack align="stretch" border="1px" spacing={2} borderRadius={5} borderColor="whiteAlpha.100">
            <HStack align="center" spacing={2} bgColor="whiteAlpha.50" borderRadius={5} py={2}>
              <Link to={`/products/${ product.id }?state=${ OPEN_ISSUE }`}>
                <PrimaryButton fontWeight={issueState === OPEN_ISSUE ? "bold" : "normal"} variant="ghost" leftIcon={<Focus />} colorScheme="whiteAlpha">
                  {numOpenIssues} Open
                </PrimaryButton>
              </Link>
              <Link to={`/products/${ product.id }?state=${ CLOSED_ISSUE }`}>
                <PrimaryButton fontWeight={issueState === CLOSED_ISSUE ? "bold" : "normal"} variant="ghost" leftIcon={<Check />} colorScheme="whiteAlpha">
                  {numClosedIssues} Closed
                </PrimaryButton>
              </Link>
            </HStack>
            {!product.issues.length && (
              <VStack align="stretch" p={4}>
                <Text fontSize="md" color="white">
                  No issues found
                </Text>
              </VStack>
            )}
            {product.issues.length && (
              <VStack align="stretch">
                {product.issues.map(issue => (
                  <IssueListItem
                    key={issue.id}
                    id={issue.id}
                    state={issue.state}
                    title={issue.title}
                    createdAt={new Date(issue.createdAt)}
                    numComments={issue.comments.length}
                  />
                ))}
              </VStack>
            )}
          </VStack>
        </ScrollAnimation>
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