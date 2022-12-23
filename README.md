# tinychat

## What's inside?

This repo uses [Yarn](https://classic.yarnpkg.com/) as a package manager. It includes the following packages/apps:

### Apps and Packages

-   `api`: tinychat's rest api
-   `gateway`: tinychat's websocket gateway for real-time communication
-   `shared`: shared logic and models between `api` and `gateway`
-   `tsconfig`: a shared `tsconfig.json`

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Commands

-   `yarn build`: build all packages/apps
-   `yarn dev`: start all apps in development mode
-   `yarn lint`: lint everything
-   `yarn format`: format everything
