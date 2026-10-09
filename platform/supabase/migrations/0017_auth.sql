create schema if not exists better_auth;

create table better_auth."user" (
  id uuid primary key,
  name text not null,
  email text not null,
  "emailVerified" boolean not null,
  image text,
  "phoneNumber" text,
  "phoneNumberVerified" boolean,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);

create table better_auth."session" (
  id uuid primary key,
  "expiresAt" timestamp not null,
  token text not null unique,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid not null references better_auth."user"(id) on delete cascade
);

create table better_auth."account" (
  id uuid primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" uuid not null references better_auth."user"(id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  scope text,
  password text,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);

create table better_auth."verification" (
  id uuid primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamp not null,
  "createdAt" timestamp,
  "updatedAt" timestamp
);

create table better_auth."rate_limit" (
  id text primary key,
  key text,
  count integer,
  "lastRequest" bigint
);

grant usage on schema better_auth to app_api;
grant all privileges on all tables in schema better_auth to app_api;
grant all privileges on all sequences in schema better_auth to app_api;
