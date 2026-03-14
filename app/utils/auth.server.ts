import axios, { type AxiosResponse } from "axios";

// the data in the cookie
export type SessionUser = {
  user_id: string;
  email: string;
  name: string;
  avatar_url: string;
};

export async function requireUser(request: Request): Promise<AxiosResponse<SessionUser>> {
  const cookie = request.headers.get("Cookie");

  // there is no cookie, so we return a 401
  if (!cookie)
    return {
      data: {} as SessionUser,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
    };

  const { origin } = new URL(request.url);

  const res = await axios.get<SessionUser>(`${origin}/ai/api/auth/me`, {
    headers: { Cookie: cookie }, // include the cookie in the request headers because we are in server code and not in the browser
    validateStatus: null,
  });

  return res;
}
