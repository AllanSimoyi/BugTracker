import { VStack } from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useCatch, useFetcher, useNavigate, useSearchParams } from "@remix-run/react";
import { useCallback } from "react";
import { z } from "zod";
import { Hero } from "~/auth/components/Hero";
import { PasswordSchema, UsernameSchema } from "~/auth/validations";
import { ActionContextProvider } from "~/core/components/ActionContextProvider";
import { CardSection } from "~/core/components/CardSection";
import { CustomAlert } from "~/core/components/CustomAlert";
import { CustomCatchBoundary } from "~/core/components/CustomCatchBoundary";
import { CustomErrorBoundary } from "~/core/components/CustomErrorBoundary";
import { TextField } from "~/core/components/CustomTextField";
import { OutlinedButton } from "~/core/components/OutlinedButton";
import { PrimaryButton } from "~/core/components/PrimaryButton";
import { ScrollAnimateUp } from "~/core/components/ScrollAnimateUp";
import type { inferSafeParseErrors } from "~/core/validations";
import { badRequest } from "~/core/validations";

import { createUserSession, getUserId } from "~/session.server";

import { createUser, getUserByUsername } from "~/users/user.server";
import { safeRedirect } from "~/utils";

export const meta: MetaFunction = () => {
  return {
    title: "Bug Tracker - Create Account",
  };
};

export async function loader ({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/issues");
  }
  return json({});
}

const Schema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
  passwordConfirmation: PasswordSchema,
  redirectTo: z.string(),
})
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ["passwordConfirmation"],
  });

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

  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    return badRequest({
      fields,
      fieldErrors: { username: ["Username already taken"] },
      formError: undefined,
    });
  }

  const user = await createUser({ username, password });
  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo: safeRedirect(redirectTo, "/"),
  });
}

export default function Join () {
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<ActionData>();

  const isProcessing = !!fetcher.submission;
  const redirectTo = searchParams.get("redirectTo") || "/";

  return (
    <Hero>
      <VStack justify={"center"} align="stretch" p={4}>
        <ScrollAnimateUp delay={0.25}>
          <fetcher.Form method="post">
            <ActionContextProvider
              fields={fetcher.data?.fields}
              fieldErrors={fetcher.data?.fieldErrors}
              formError={fetcher.data?.formError}
              isSubmitting={isProcessing}
            >
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <CardSection noBottomBorder py={2}>
                {fetcher.data?.formError && (
                  <ScrollAnimateUp delay={0}>
                    <CustomAlert status="error">
                      {fetcher.data?.formError}
                    </CustomAlert>
                  </ScrollAnimateUp>
                )}
              </CardSection>
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
                <TextField
                  formControlProps={{ labelProps: { color: "whiteAlpha.800" } }}
                  bg="white"
                  name="passwordConfirmation"
                  label="Re-enter Password"
                  placeholder="Re-enter Password"
                  type="password"
                />
              </CardSection>
              <CardSection noBottomBorder py={2}>
                <PrimaryButton type="submit" isDisabled={isProcessing}>
                  {isProcessing ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </PrimaryButton>
              </CardSection>
            </ActionContextProvider>
          </fetcher.Form>
          <CardSection noBottomBorder py={4}>
            <Link to="/login">
              <OutlinedButton w="100%" isDisabled={isProcessing} colorScheme="whiteAlpha">
                ALREADY HAVE AN ACCOUNT
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