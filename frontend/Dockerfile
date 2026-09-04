# Production build, not the Vite dev server (`npm run dev`) this used to run.
# The dev server has no business being reachable from the internet: it has an
# open transform pipeline that treats most request paths as "try to read and
# compile this file," which a credential-scanning bot's junk requests (e.g.
# GET /.aws/credentials) can trip into a real filesystem read attempt —
# harmless here (nothing sensitive at those paths), but it's needless attack
# surface and it broadcasts the resulting error to every connected browser
# tab via the shared HMR overlay, which is what made an unrelated bot's
# traffic show up as a crash in a real user's own session.
#
# Two stages: build the static bundle with Node, then serve ONLY that output
# with nginx — no Node process, no dev server, no transform pipeline in the
# image that actually runs.
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.container.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
