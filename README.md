# Why?

My Netgear XS712Tv2 periodically goes on a factory reset rampage and grinds my whole network to a halt. This monitors the state of the switch and fixes it when an unauthorized factory reset is detected.

# What if I want to factory reset it and not reconfigure it?

Close this program.

# Run Locally

1. Install Node.js.
2. Install NPM dependencies: `npm install`
3. Install Playwright: `npx playwright install`
4. Install Playwright Dependencies: `npx playwright install install-deps`
5. Transpile TypeScript: `npx tsc`
6. Copy `.env.example` to `.env` and edit to suit your taste. You probably need to have a different configured IP address than the default IP address.
7. Backup/download your current `startup-config` file and rename it to the path you specified in your `.env`.
8. Run it with Node.js: `node dist/src/index`

# Run in Docker

I've got a specific configuration I use for Podman. In this case I will use the normal default route to access the management IP of my configured switch and I will use an externally configured macvlan network called `vlandown` which will have an IP address in the `192.168.0.0/24` network, same as the default configuration for the switch, where Ethernet frames won't be tagged by the OS and it can access the factory default configured switch. Once it is setup:

1. Install Podman or Docker and Docker Compose.
2. Run it: `docker compose up -d --build` or `podman compose up -d --build`
