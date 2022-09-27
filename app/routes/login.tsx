import { Button, VStack } from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useCatch, useFetcher, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import * as React from "react";
import { z } from "zod";
import { Hero } from "~/auth/components/Hero";
import { UsernameSchema } from "~/auth/validations";
import { ActionContextProvider } from "~/core/components/ActionContextProvider";
import { CardSection } from "~/core/components/CardSection";
import { CustomAlert } from "~/core/components/CustomAlert";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import { TextField } from "~/core/components/CustomTextField";
import { OutlinedButton } from "~/core/components/OutlinedButton";
import { ScrollAnimateUp } from "~/core/components/ScrollAnimateUp";
import type { inferSafeParseErrors } from "~/core/validations";
import { badRequest } from "~/core/validations";

import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/users/user.server";
import { safeRedirect } from "~/utils";

export const meta: MetaFunction = () => {
  return {
    title: "Bug Tracker - Login",
  };
};

export async function loader ({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/issues");
  }

  const url = new URL(request.url);
  const message = url.searchParams.get("message") || '';

  return json({ message });
}

const Schema = z.object({
  username: UsernameSchema,
  password: z.string().min(1),
  redirectTo: z.string(),
})

type Fields = z.infer<typeof Schema>;
type FieldErrors = inferSafeParseErrors<typeof Schema>;
type ActionData = {
  formError?: string
  fields?: Fields
  fieldErrors?: FieldErrors
};

export async function action ({ request }: ActionArgs) {
  const formData = await request.formData();
  const fields = Object.fromEntries(formData.entries());

  const result = await Schema.safeParseAsync(fields);
  if (!result.success) {
    const { formErrors, fieldErrors } = result.error.flatten();
    return badRequest({ fields, fieldErrors, formError: formErrors.join(", ") });
  }
  const { username, password, redirectTo } = result.data;

  const user = await verifyLogin(username, password);
  if (!user) {
    return badRequest({ fields, formError: `Incorrect credentials` });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo: safeRedirect(redirectTo, "/"),
  });
}

export default function LoginPage () {
  const [searchParams] = useSearchParams();
  const { message } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();

  const isProcessing = !!fetcher.submission;
  const redirectTo = searchParams.get("redirectTo") || "/";

  return (
    <Hero>
      <VStack justify={"center"} align="stretch" p={4}>
        {message && (
          <VStack py={2}>
            <ScrollAnimateUp delay={0.25}>
              <CustomAlert status="warning">{message}</CustomAlert>
            </ScrollAnimateUp>
          </VStack>
        )}
        <ScrollAnimateUp delay={0.25}>
          <fetcher.Form method="post">
            <ActionContextProvider
              fields={fetcher.data?.fields}
              fieldErrors={fetcher.data?.fieldErrors}
              formError={fetcher.data?.formError}
              isSubmitting={isProcessing}
            >
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <CardSection noBottomBorder py={6}>
                <TextField
                  formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                  bg="white"
                  name="username"
                  label="Username"
                  placeholder="JohnDoe"
                />
                <TextField
                  formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                  bg="white"
                  name="password"
                  label="Password"
                  placeholder="Password"
                  type="password"
                />
                {fetcher.data?.formError && (
                  <VStack py={2} align="stretch">
                    <ScrollAnimateUp delay={0.25}>
                      <CustomAlert status="error">
                        {fetcher.data.formError}
                      </CustomAlert>
                    </ScrollAnimateUp>
                  </VStack>
                )}
              </CardSection>
              <CardSection noBottomBorder py={2}>
                <Button type="submit" isDisabled={isProcessing} colorScheme="teal">
                  {isProcessing ? "LOGGING IN..." : "LOG IN"}
                </Button>
              </CardSection>
            </ActionContextProvider>
          </fetcher.Form>
          <CardSection noBottomBorder py={4}>
            <Link to="/join">
              <OutlinedButton w="100%" isDisabled={isProcessing} colorScheme="whiteAlpha">
                DONT' HAVE AN ACCOUNT
              </OutlinedButton>
            </Link>
          </CardSection>
        </ScrollAnimateUp>
      </VStack>
    </Hero>
  );
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