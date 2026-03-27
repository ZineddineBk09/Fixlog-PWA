import { db } from "./db";
import { supabase } from "./supabase";
import type { Mechanic } from "@/hooks/use-auth";

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface InviteRecord {
  id: string;
  token: string;
  created_by_mechanic_id: string | null;
  created_by_name: string;
  note: string | null;
  status: InviteStatus;
  expires_at: string;
  accepted_at?: string | null;
  accepted_mechanic_id?: string | null;
  accepted_mechanic_name?: string | null;
  created_at: string;
}

export interface PublicInviteRecord {
  id: string;
  created_by_name: string;
  note: string | null;
  status: InviteStatus;
  expires_at: string;
  accepted_at?: string | null;
  accepted_mechanic_name?: string | null;
  created_at: string;
}

export type InviteErrorKey =
  | "inviteNeedsInternet"
  | "inviteCreatorRequired"
  | "inviteCreateFailed"
  | "inviteInvalid"
  | "inviteExpired"
  | "inviteAlreadyUsed"
  | "inviteRevoked"
  | "inviteNameRequired"
  | "inviteNameTaken"
  | "invitePinInvalid"
  | "invitePinMismatch"
  | "inviteAcceptFailed";

function getSingleRow<T>(value: T[] | T | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapInviteError(error: unknown): InviteErrorKey {
  const message =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "";

  if (message.includes("invite_creator_required")) {
    return "inviteCreatorRequired";
  }
  if (message.includes("invite_invalid")) {
    return "inviteInvalid";
  }
  if (message.includes("invite_expired")) {
    return "inviteExpired";
  }
  if (message.includes("invite_already_used")) {
    return "inviteAlreadyUsed";
  }
  if (message.includes("invite_revoked")) {
    return "inviteRevoked";
  }
  if (message.includes("invite_name_required")) {
    return "inviteNameRequired";
  }
  if (message.includes("invite_name_taken")) {
    return "inviteNameTaken";
  }
  if (message.includes("invite_pin_invalid")) {
    return "invitePinInvalid";
  }

  return "inviteAcceptFailed";
}

export const inviteService = {
  async createInvite(
    mechanic: Mechanic,
    note?: string,
  ): Promise<
    | { success: true; invite: InviteRecord }
    | { success: false; errorKey: InviteErrorKey }
  > {
    if (!navigator.onLine) {
      return { success: false, errorKey: "inviteNeedsInternet" };
    }

    try {
      const { data, error } = await supabase.rpc("create_account_invite", {
        p_created_by_mechanic_id: mechanic.id,
        p_created_by_name: mechanic.name,
        p_note: note?.trim() || null,
      });

      if (error) {
        return {
          success: false,
          errorKey:
            mapInviteError(error) === "inviteAcceptFailed"
              ? "inviteCreateFailed"
              : mapInviteError(error),
        };
      }

      const invite = getSingleRow<InviteRecord>(data);
      if (!invite) {
        return { success: false, errorKey: "inviteCreateFailed" };
      }

      return { success: true, invite };
    } catch {
      return { success: false, errorKey: "inviteCreateFailed" };
    }
  },

  async listInvites(
    mechanicId: string,
  ): Promise<
    | { success: true; invites: InviteRecord[] }
    | { success: false; errorKey: InviteErrorKey }
  > {
    if (!navigator.onLine) {
      return { success: false, errorKey: "inviteNeedsInternet" };
    }

    try {
      const { data, error } = await supabase.rpc("list_account_invites", {
        p_created_by_mechanic_id: mechanicId,
      });

      if (error) {
        return { success: false, errorKey: "inviteCreateFailed" };
      }

      return { success: true, invites: (data as InviteRecord[] | null) ?? [] };
    } catch {
      return { success: false, errorKey: "inviteCreateFailed" };
    }
  },

  async getInvite(
    token: string,
  ): Promise<
    | { success: true; invite: PublicInviteRecord | null }
    | { success: false; errorKey: InviteErrorKey }
  > {
    if (!navigator.onLine) {
      return { success: false, errorKey: "inviteNeedsInternet" };
    }

    try {
      const { data, error } = await supabase.rpc("get_account_invite", {
        p_token: token,
      });

      if (error) {
        return { success: false, errorKey: "inviteInvalid" };
      }

      return {
        success: true,
        invite: getSingleRow<PublicInviteRecord>(data),
      };
    } catch {
      return { success: false, errorKey: "inviteInvalid" };
    }
  },

  async acceptInvite(
    token: string,
    name: string,
    pin: string,
  ): Promise<
    | { success: true; mechanic: Mechanic }
    | { success: false; errorKey: InviteErrorKey }
  > {
    if (!navigator.onLine) {
      return { success: false, errorKey: "inviteNeedsInternet" };
    }

    try {
      const { data, error } = await supabase.rpc("accept_account_invite", {
        p_token: token,
        p_name: name.trim(),
        p_pin: pin.trim(),
      });

      if (error) {
        return { success: false, errorKey: mapInviteError(error) };
      }

      const mechanic = getSingleRow<Mechanic>(data);
      if (!mechanic) {
        return { success: false, errorKey: "inviteAcceptFailed" };
      }

      await db.mechanics.put(mechanic);

      return { success: true, mechanic };
    } catch (error) {
      return { success: false, errorKey: mapInviteError(error) };
    }
  },
};
