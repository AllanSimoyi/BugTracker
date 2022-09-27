import { Img, VStack } from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useCatch, useFetcher, useNavigate, useSearchParams } from "@remix-run/react";
import { useCallback } from "react";
import { z } from "zod";
import { Hero } from "~/auth/components/Hero";
import { PasswordSchema, UsernameSchema } from "~/auth/validations";
import { ActionContextProvider } from "~/core/components/ActionContextProvider";
import { Card } from "~/core/components/Card";
import { CardHeading } from "~/core/components/CardHeading";
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
      fieldErrors: { emailAddress: ["Username already taken"] },
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
      <VStack justify={"center"} align="stretch" p={4} w={["100%", "80%", "40%"]}>
        <VStack justify={"center"} align="center" p={4}>
          <ScrollAnimateUp delay={0}>
            <Link to="/">
              <Img boxSize="40" objectFit="contain" src="images/logo.png" alt="Bug Tracker" />
            </Link>
          </ScrollAnimateUp>
        </VStack>
        <ScrollAnimateUp delay={0.25}>
          <Card>
            <fetcher.Form method="post">
              <ActionContextProvider
                fields={fetcher.data?.fields}
                fieldErrors={fetcher.data?.fieldErrors}
                formError={fetcher.data?.formError}
                isSubmitting={isProcessing}
              >
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <CardHeading>Create Account</CardHeading>
                <CardSection py={6}>
                  <TextField
                    name="username"
                    label="Username"
                    placeholder="JohnDoe"
                  />
                  <TextField
                    name="password"
                    label="Password"
                    placeholder="Password"
                    type="password"
                  />
                  <TextField
                    name="passwordConfirmation"
                    label="Re-enter Password"
                    placeholder="Re-enter Password"
                    type="password"
                  />
                  {fetcher.data?.formError && (
                    <VStack py={2}>
                      <ScrollAnimateUp delay={0}>
                        <CustomAlert status="error">
                          {fetcher.data?.formError}
                        </CustomAlert>
                      </ScrollAnimateUp>
                    </VStack>
                  )}
                </CardSection>
                <CardSection>
                  <PrimaryButton type="submit" isDisabled={isProcessing}>
                    {isProcessing ? "Creating Account..." : "Create Account"}
                  </PrimaryButton>
                </CardSection>
              </ActionContextProvider>
            </fetcher.Form>
            <CardSection noBottomBorder>
              <Link to="/login">
                <OutlinedButton w="100%" isDisabled={isProcessing}>
                  Already Have An Account
                </OutlinedButton>
              </Link>
            </CardSection>
          </Card>
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