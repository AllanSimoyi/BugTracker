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
import { requireUser } from "~/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Bug Tracker - Edit Product",
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
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(800),
})

type Fields = z.infer<typeof Schema>;
type FieldErrors = inferSafeParseErrors<typeof Schema>;
type ActionData = {
  formError?: string
  fields?: Fields
  fieldErrors?: FieldErrors
};

export async function action ({ request, params }: ActionArgs) {
  await requireUser(request);

  const slugResult = await PositiveIntSchema.safeParseAsync(params.id);
  if (!slugResult.success) {
    throw new Response("Invalid product ID", { status: 400 });
  }
  const id = slugResult.data;

  const formData = await request.formData();
  const fields = Object.fromEntries(formData.entries());

  const result = await Schema.safeParseAsync(fields);
  if (!result.success) {
    const { formErrors, fieldErrors } = result.error.flatten();
    return badRequest({ fields, fieldErrors, formError: formErrors.join(", ") });
  }
  const { name, description } = result.data;

  await prisma.product.update({
    where: { id },
    data: { name, description },
  });

  return redirect(`/products/${ id }`);
}

export default function EditProduct () {
  const { product } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const isProcessing = !!fetcher.submission;

  const defaultValues: Fields = {
    name: product.name,
    description: product.description,
  }

  return (
    <VStack justify={"center"} align="stretch">
      <ScrollAnimateUp delay={0.25}>
        <fetcher.Form method="post">
          <ActionContextProvider
            fields={fetcher.data?.fields || defaultValues}
            fieldErrors={fetcher.data?.fieldErrors}
            formError={fetcher.data?.formError}
            isSubmitting={isProcessing}
          >
            <CardSection py={2}>
              <VStack align="flex-start" py={4}>
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
                    <Text>Edit</Text>
                  </BreadcrumbItem>
                </Breadcrumb>
              </VStack>
            </CardSection>
            {fetcher.data?.formError && (
              <CardSection noBottomBorder py={2}>
                <ScrollAnimateUp delay={0.25}>
                  <CustomAlert status="error">
                    {fetcher.data.formError}
                  </CustomAlert>
                </ScrollAnimateUp>
              </CardSection>
            )}
            <CardSection noBottomBorder py={6}>
              <TextField
                formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                bg="blackAlpha.50"
                color="white"
                name="name"
                label="Name of Product"
                placeholder="Name of Product"
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
                {isProcessing ? "UPDATING PRODUCT..." : "UPDATE PRODUCT"}
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