import { auth } from "~/lib/auth.server";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export async function requireUser(request: Request): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  };
}
