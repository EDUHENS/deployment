export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  audience: process.env.AUTH0_AUDIENCE!,
  scope: process.env.AUTH0_SCOPE!,
  baseURL: process.env.AUTH0_BASE_URL!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
};