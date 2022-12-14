import { ChakraProvider } from '@chakra-ui/react';
import { withEmotionCache } from '@emotion/react';
import type { LinksFunction, LoaderArgs, MetaFunction } from '@remix-run/node'; // Depends on the runtime you choose
import { json } from '@remix-run/node'; // Depends on the runtime you choose
import {
  Links,
  LiveReload,
  Meta, Outlet, Scripts,
  ScrollRestoration
} from '@remix-run/react';
import React, { useContext, useEffect } from 'react';
import tailwindStylesheetUrl from "./styles/tailwind.css";

import { ClientStyleContext, ServerStyleContext } from './context';
import { getUser } from './session.server';
import customStylesUrl from "./styles/custom.css";
import theme from './theme';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Bug Tracker',
  viewport: 'width=device-width,initial-scale=1',
});

export let links: LinksFunction = () => {
  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap'
    },
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: customStylesUrl }
  ]
}

interface DocumentProps {
  children: React.ReactNode;
}

const Document = withEmotionCache(
  ({ children }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext);
    const clientStyleData = useContext(ClientStyleContext);

    // Only executed on client
    useEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head;
      // re-inject tags
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      // reset cache to reapply global styles
      clientStyleData?.reset();
    }, []);

    return (
      <html lang="en" className="h-full">
        <head>
          <Meta />
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(' ')}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body className="h-full bg-slate-900">
          {children}
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }
);

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
  });
}

export default function App() {
  return (
    <Document>
      <ChakraProvider theme={theme}>
        <Outlet />
      </ChakraProvider>
    </Document>
  )
}