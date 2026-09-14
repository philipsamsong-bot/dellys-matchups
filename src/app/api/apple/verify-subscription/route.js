// src/app/api/apple/verify-subscription/route.js

import {
    AppStoreServerAPIClient,
    Environment,
    SignedDataVerifier,
  } from "@apple/app-store-server-library";
  import { createClient } from "@supabase/supabase-js";
  import { NextResponse } from "next/server";
  
  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";
  
  const APPLE_BUNDLE_ID =
    process.env.APPLE_BUNDLE_ID || "org.dellysmatchups.app";
  
  const APPLE_APP_ID = 6800447996;
  
  const PRODUCT_TO_PLAN = Object.freeze({
    "org.dellysmatchups.premium.monthly": "premium",
    "org.dellysmatchups.vip.monthly": "vip",
  });
  
  const APPLE_ROOT_CERTIFICATE_URLS = Object.freeze([
    "https://www.apple.com/appleca/AppleIncRootCertificate.cer",
    "https://www.apple.com/certificateauthority/AppleRootCA-G2.cer",
    "https://www.apple.com/certificateauthority/AppleRootCA-G3.cer",
  ]);
  
  let appleRootCertificatesPromise = null;
  
  function json(body, status = 200) {
    return NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
  
  function getBearerToken(request) {
    const authorization = request.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
  
    return match?.[1]?.trim() || null;
  }
  
  function requireEnvironmentVariable(name) {
    const value = process.env[name]?.trim();
  
    if (!value) {
      throw new Error(`Missing server environment variable: ${name}.`);
    }
  
    return value;
  }
  
  function normalizePrivateKey(value) {
    const trimmed = value.trim();
  
    if (trimmed.includes("\\n")) {
      return trimmed.replace(/\\n/g, "\n");
    }
  
    return trimmed;
  }
  
  function createSupabaseAdmin() {
    const supabaseUrl = requireEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
    const serviceRoleKey = requireEnvironmentVariable(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  
  async function authenticateRequest(request, supabaseAdmin) {
    const accessToken = getBearerToken(request);
  
    if (!accessToken) {
      return {
        user: null,
        response: json(
          {
            success: false,
            error: "Authentication is required.",
          },
          401,
        ),
      };
    }
  
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);
  
    if (error || !user) {
      return {
        user: null,
        response: json(
          {
            success: false,
            error:
              "Your session is invalid or has expired. Please sign in again.",
          },
          401,
        ),
      };
    }
  
    return {
      user,
      response: null,
    };
  }
  
  async function fetchCertificate(url) {
    const response = await fetch(url, {
      cache: "force-cache",
    });
  
    if (!response.ok) {
      throw new Error(
        `Unable to load Apple root certificate (${response.status}).`,
      );
    }
  
    return Buffer.from(await response.arrayBuffer());
  }
  
  async function getAppleRootCertificates() {
    if (!appleRootCertificatesPromise) {
      appleRootCertificatesPromise = Promise.all(
        APPLE_ROOT_CERTIFICATE_URLS.map(fetchCertificate),
      ).catch((error) => {
        appleRootCertificatesPromise = null;
        throw error;
      });
    }
  
    return appleRootCertificatesPromise;
  }
  
  function createAppleClient(environment) {
    const issuerId = requireEnvironmentVariable(
      "APPLE_IAP_ISSUER_ID",
    );
    const keyId = requireEnvironmentVariable(
      "APPLE_IAP_KEY_ID",
    );
    const privateKey = normalizePrivateKey(
      requireEnvironmentVariable("APPLE_IAP_PRIVATE_KEY"),
    );
  
    return new AppStoreServerAPIClient(
      privateKey,
      keyId,
      issuerId,
      APPLE_BUNDLE_ID,
      environment,
    );
  }
  
  async function createAppleVerifier(environment) {
    const rootCertificates = await getAppleRootCertificates();
  
    return new SignedDataVerifier(
      rootCertificates,
      true,
      environment,
      APPLE_BUNDLE_ID,
      environment === Environment.PRODUCTION
        ? APPLE_APP_ID
        : undefined,
    );
  }
  
  async function getTransactionFromEnvironment(
    transactionId,
    environment,
  ) {
    const client = createAppleClient(environment);
  
    const transactionResponse =
      await client.getTransactionInfo(transactionId);
  
    if (!transactionResponse?.signedTransactionInfo) {
      throw new Error(
        "Apple did not return signed transaction information.",
      );
    }
  
    const verifier = await createAppleVerifier(environment);
  
    const transaction =
      await verifier.verifyAndDecodeTransaction(
        transactionResponse.signedTransactionInfo,
      );
  
    return {
      transaction,
      environment,
    };
  }
  
  async function getVerifiedAppleTransaction(transactionId) {
    try {
      return await getTransactionFromEnvironment(
        transactionId,
        Environment.PRODUCTION,
      );
    } catch (productionError) {
      try {
        return await getTransactionFromEnvironment(
          transactionId,
          Environment.SANDBOX,
        );
      } catch (sandboxError) {
        console.error("APPLE TRANSACTION VERIFICATION FAILED:", {
          transactionId,
          productionError:
            productionError instanceof Error
              ? productionError.message
              : String(productionError),
          sandboxError:
            sandboxError instanceof Error
              ? sandboxError.message
              : String(sandboxError),
        });
  
        throw new Error(
          "Apple could not verify this subscription transaction.",
        );
      }
    }
  }
  
  function normalizeUuid(value) {
    return typeof value === "string"
      ? value.trim().toLowerCase()
      : "";
  }
  
  function validateTransaction({
    transaction,
    requestedTransactionId,
    userId,
  }) {
    if (!transaction) {
      throw new Error("Apple returned an empty transaction.");
    }
  
    const productId =
      typeof transaction.productId === "string"
        ? transaction.productId.trim()
        : "";
  
    const plan = PRODUCT_TO_PLAN[productId];
  
    if (!plan) {
      throw new Error(
        "This Apple product is not a Delly's Matchups membership.",
      );
    }
  
    if (
      !transaction.transactionId ||
      transaction.transactionId !== requestedTransactionId
    ) {
      throw new Error("Apple returned an unexpected transaction.");
    }
  
    if (!transaction.originalTransactionId) {
      throw new Error(
        "Apple did not return an original transaction ID.",
      );
    }
  
    const appAccountToken = normalizeUuid(
      transaction.appAccountToken,
    );
    const authenticatedUserId = normalizeUuid(userId);
  
    if (!appAccountToken) {
      throw new Error(
        "This Apple transaction is not linked to a Delly's Matchups account.",
      );
    }
  
    if (appAccountToken !== authenticatedUserId) {
      throw new Error(
        "This Apple transaction belongs to a different account.",
      );
    }
  
    if (transaction.revocationDate) {
      throw new Error(
        "This Apple subscription transaction has been revoked.",
      );
    }
  
    const expiresDate =
      typeof transaction.expiresDate === "number"
        ? transaction.expiresDate
        : Number(transaction.expiresDate);
  
    if (
      !Number.isFinite(expiresDate) ||
      expiresDate <= Date.now()
    ) {
      throw new Error(
        "This Apple subscription is not currently active.",
      );
    }
  
    return {
      plan,
      productId,
      transactionId: transaction.transactionId,
      originalTransactionId:
        transaction.originalTransactionId,
      expiresDate,
    };
  }
  
  export async function POST(request) {
    try {
      const supabaseAdmin = createSupabaseAdmin();
  
      const { user, response } = await authenticateRequest(
        request,
        supabaseAdmin,
      );
  
      if (response || !user) {
        return response;
      }
  
      let body;
  
      try {
        body = await request.json();
      } catch {
        return json(
          {
            success: false,
            error: "Invalid request body.",
          },
          400,
        );
      }
  
      const transactionId =
        typeof body?.transactionId === "string"
          ? body.transactionId.trim()
          : "";
  
      if (!transactionId) {
        return json(
          {
            success: false,
            error: "Apple transaction ID is required.",
          },
          400,
        );
      }
  
      const { transaction, environment } =
        await getVerifiedAppleTransaction(transactionId);
  
      const validated = validateTransaction({
        transaction,
        requestedTransactionId: transactionId,
        userId: user.id,
      });
  
      const {
        error: updateError,
      } = await supabaseAdmin
        .from("profiles")
        .update({
          membership_plan: validated.plan,
          subscription_status: "active",
          vip_badge: validated.plan === "vip",
          apple_transaction_id: validated.transactionId,
          apple_original_transaction_id:
            validated.originalTransactionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
  
      if (updateError) {
        console.error("APPLE MEMBERSHIP UPDATE ERROR:", {
          userId: user.id,
          transactionId: validated.transactionId,
          message: updateError.message,
        });
  
        return json(
          {
            success: false,
            error:
              "Your Apple purchase was verified, but your membership could not be updated.",
          },
          500,
        );
      }
  
      return json({
        success: true,
        plan: validated.plan,
        productId: validated.productId,
        transactionId: validated.transactionId,
        originalTransactionId:
          validated.originalTransactionId,
        expiresDate: validated.expiresDate,
        environment:
          environment === Environment.PRODUCTION
            ? "production"
            : "sandbox",
      });
    } catch (error) {
      console.error("APPLE SUBSCRIPTION VERIFY ERROR:", error);
  
      return json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to verify Apple subscription.",
        },
        500,
      );
    }
  }