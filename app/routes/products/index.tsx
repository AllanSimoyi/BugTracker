import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { z } from "zod";
import { ActionContextProvider } from "~/core/components/ActionContextProvider";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import type { inferSafeParseErrors } from "~/core/validations";

import type { Product } from "@prisma/client";
import { useCallback } from "react";
import { X } from "tabler-icons-react";
import { prisma } from "~/db.server";
import { ProductListItem } from "~/products/components/ProductListItem";
import { SearchProducts } from "~/products/components/SearchProducts";
import { requireUser } from "~/session.server";

const Schema = z.object({
  searchTerms: z.string().optional(),
});

export async function loader ({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const searchTerms = url.searchParams.get("searchTerms") || undefined;

  const result = await Schema.safeParseAsync({ searchTerms });
  if (!result.success) {
    throw new Response("Invalid input, please reload the page", { status: 400 });
  }
  const input = result.data;

  const [currentUser, products] = await Promise.all([
    requireUser(request),
    searchTerms ?
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: input.searchTerms } },
            { description: { contains: input.searchTerms } },
          ]
        },
      }) :
      prisma.product.findMany()
  ]);

  return json({
    currentUser,
    products: products.sort((a, b) => b.id - a.id),
    fields: input
  });
}

type Fields = z.infer<typeof Schema>;
type FieldErrors = inferSafeParseErrors<typeof Schema>;
type ActionData = {
  formError?: string
  fields?: Fields
  fieldErrors?: FieldErrors,
  products: Product[]
};

export default function Index () {
  const { products, fields } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();

  const relevantProducts = fetcher.data?.products || products;
  const relevantInput = fetcher.data?.fields || fields;

  const isProcessing = !!fetcher.submission;

  return (
    <>
      <fetcher.Form method="get">
        <ActionContextProvider
          fields={relevantInput}
          fieldErrors={fetcher.data?.fieldErrors}
          formError={fetcher.data?.formError}
          isSubmitting={isProcessing}
        >
          <SearchProducts isProcessing={isProcessing} />
        </ActionContextProvider>
      </fetcher.Form>
      {relevantInput?.searchTerms && (
        <HStack align="center" px={4} spacing={4}>
          <Text fontSize="sm" color="gray.400">
            {relevantProducts.length} result(s) for products matching <b>"{relevantInput.searchTerms}"</b>
          </Text>
          <fetcher.Form method="get">
            <input name="searchTerms" type="hidden" value="" />
            <Button type="submit" rightIcon={<X />} colorScheme='whiteAlpha' size="sm" variant='outline'>
              Clear
            </Button>
          </fetcher.Form>
        </HStack>
      )}
      {!relevantProducts.length && (
        <VStack align="stretch" p={4}>
          <Text fontSize="md" color="gray.400">No products found</Text>
        </VStack>
      )}
      {relevantProducts.length && (
        <VStack align="stretch" p={4}>
          {relevantProducts.map(product => (
            <ProductListItem key={product.id} {...product} />
          ))}
        </VStack>
      )}
    </>
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