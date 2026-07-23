/* Payload admin shell, from the official Payload Next.js template. */
import config from "@payload-config";
import "@payloadcms/next/css";
// Custom admin surfaces (.qs-*). Payload 3.86 has no admin.css config key, so
// importing here is the supported way in. Must stay after Payload's own sheet.
import "./custom.css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import React from "react";

import { importMap } from "./importMap.js";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    {children}
  </RootLayout>
);

export default Layout;
