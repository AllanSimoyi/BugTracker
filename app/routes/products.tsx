import { Heading, VStack } from "@chakra-ui/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useCatch, useLoaderData, useNavigate } from "@remix-run/react";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";

import { useCallback } from "react";
import { CenteredView } from "~/core/components/CenteredView";
import { Toolbar } from "~/core/components/Toolbar";
import { requireUser } from "~/session.server";

export async function loader ({ request }: LoaderArgs) {
  const currentUser = await requireUser(request);

  return json({ currentUser });
}

export default function Index () {
  const { currentUser } = useLoaderData<typeof loader>();

  return (
    <VStack align="stretch" spacing={0}>
      <Toolbar currentUser={currentUser} />
      <VStack align="stretch" py={6}>
        <CenteredView flexGrow={1}>
          <VStack align="flex-start">
            <Link to="/products">
              <Heading role="heading" size="md" color="white" px={4}>
                Products
              </Heading>
            </Link>
          </VStack>
          <Outlet />
        </CenteredView>
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