import type { InterventionPayload } from "@imaan/contracts";

import { createIntervention, BackendApiError } from "@/src/lib/backend/client";
import { getAuthenticatedBackendActor } from "@/src/lib/session/session-cache";

export class HomeInterventionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
  }
}

export async function submitHomeIntervention(inputText: string): Promise<InterventionPayload> {
  const actor = await getAuthenticatedBackendActor();

  try {
    return await createIntervention(
      {
        entrySource: actor ? "home_authenticated" : "home_anonymous",
        inputText,
        locale: "en",
      },
      actor?.accessToken ?? null,
    );
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new HomeInterventionError(error.message, error.status, error.payload);
    }

    throw error;
  }
}
