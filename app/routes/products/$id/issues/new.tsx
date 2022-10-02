import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink, Text, VStack
} from '@chakra-ui/react';
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useCatch, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import * as React from "react";
import { ChevronRight } from 'tabler-icons-react';
import { z } from "zod";
import { ActionContextProvider } from "~/core/components/ActionContextProvider";
import { CardSection } from "~/core/components/CardSection";
import { CustomAlert } from "~/core/components/CustomAlert";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import { CustomTextArea } from "~/core/components/CustomTextArea";
import { TextField } from "~/core/components/CustomTextField";
import { PrimaryButton } from "~/core/components/PrimaryButton";
import { ScrollAnimateUp } from "~/core/components/ScrollAnimateUp";
import type { inferSafeParseErrors } from "~/core/validations";
import { badRequest, PositiveIntSchema } from "~/core/validations";
import { prisma } from "~/db.server";
import { OPEN_ISSUE } from "~/issues/lib/issues";
import { requireUser } from "~/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Bug Tracker - Record Issue",
  };
};

export async function loader ({ request, params }: LoaderArgs) {
  await requireUser(request);

  const result = await PositiveIntSchema.safeParseAsync(params.id);
  if (!result.success) {
    throw new Response("Invalid product ID", { status: 400 });
  }
  const id = result.data;

  const product = await prisma.product.findUnique({
    where: { id }
  });
  if (!product) {
    throw new Response("Product record not found", { status: 404 });
  }

  return json({ product });
}

const Schema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(800),
  productId: PositiveIntSchema,
})

type Fields = z.infer<typeof Schema>;
type FieldErrors = inferSafeParseErrors<typeof Schema>;
type ActionData = {
  formError?: string
  fields?: Fields
  fieldErrors?: FieldErrors
};

export async function action ({ request }: ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const fields = Object.fromEntries(formData.entries());

  const result = await Schema.safeParseAsync(fields);
  if (!result.success) {
    const { formErrors, fieldErrors } = result.error.flatten();
    return badRequest({ fields, fieldErrors, formError: formErrors.join(", ") });
  }
  const { productId, title, description } = result.data;

  await prisma.issue.create({
    data: { productId, title, description, state: OPEN_ISSUE },
  });

  return redirect(`/products/${ productId }`);
}

export default function NewIssue () {
  const { product } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const isProcessing = !!fetcher.submission;

  return (
    <VStack justify={"center"} align="stretch">
      <ScrollAnimateUp delay={0.25}>
        <fetcher.Form method="post">
          <ActionContextProvider
            fields={fetcher.data?.fields}
            fieldErrors={fetcher.data?.fieldErrors}
            formError={fetcher.data?.formError}
            isSubmitting={isProcessing}
          >
            <input type="hidden" name="productId" value={product.id} />
            <CardSection noBottomBorder py={2}>
              {fetcher.data?.formError && (
                <ScrollAnimateUp delay={0.25}>
                  <CustomAlert status="error">
                    {fetcher.data.formError}
                  </CustomAlert>
                </ScrollAnimateUp>
              )}
            </CardSection>
            <CardSection noBottomBorder spacing={6} py={4}>
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
                    <Text>Record Issue</Text>
                  </BreadcrumbItem>
                </Breadcrumb>
                <Text fontSize="sm" color="white">
                  {product.description}
                </Text>
              </VStack>
              <TextField
                formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                bg="blackAlpha.50"
                color="white"
                name="title"
                label="Title"
                placeholder="Title"
              />
              <CustomTextArea
                formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                bg="blackAlpha.50"
                color="white"
                name="description"
                label="Description"
                placeholder="Description"
              />
            </CardSection>
            <CardSection noBottomBorder py={2}>
              <PrimaryButton type="submit" isDisabled={isProcessing}>
                {isProcessing ? "RECORDING ISSUE..." : "RECORD ISSUE"}
              </PrimaryButton>
            </CardSection>
          </ActionContextProvider>
        </fetcher.Form>
      </ScrollAnimateUp>
    </VStack>
  )
}

export function CatchBoundary () {
  const caught = useCatch();
  const navigate = useNavigate();
  const reload = React.useCallback(() => {
    navigate('.', { replace: true })
  }, [navigate]);
  return <CustomCatchBoundary reload={reload} caught={caught} />
}

export function ErrorBoundary ({ error }: { error: Error }) {
  console.error(error);
  const navigate = useNavigate();
  const reload = React.useCallback(() => {
    navigate('.', { replace: true })
  }, [navigate]);
  return <CustomErrorBoundary reload={reload} error={error} />
}