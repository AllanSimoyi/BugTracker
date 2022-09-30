import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useCatch, useNavigate } from "@remix-run/react";
import { useCallback } from "react";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import { getUserId } from "~/session.server";

export async function loader ({ request }: LoaderArgs) {
  const currentUserId = await getUserId(request);
  if (currentUserId) {
    return redirect("/products");
  }
  return redirect("/login");
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