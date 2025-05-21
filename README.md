# Bash over WebSockets

This project exposes a bash session over WebSockets, allowing you to interact with a terminal in your web browser.

## Important: Original Compatibility Issues & Modernization Steps

The original `pty.js` dependency (version `~0.2.4` as specified in `package.json`) is a native C++ addon that is **not compatible with modern versions of Node.js (e.g., v12, v14, v16, v18 and newer)**. Compilation of `pty.js` fails in these environments.

**Initial Modernization Steps Taken:**
To make the project runnable on a modern Node.js system (specifically Node.js v18 during testing):
1.  `pty.js` was replaced with `node-pty` (version `^0.10.1`) in `package.json`.
2.  `server.js` was refactored to use the `node-pty` API for terminal spawning and data handling.
3.  The server port was changed from 80 to **3000** to avoid permission issues on non-root execution.

After these changes, the core functionality of the application was restored on a modern Node.js environment.

## Key Technologies (Post-Initial Modernization)

*   **Node.js:** A JavaScript runtime environment that executes JavaScript code server-side.
*   **Express:** A minimal and flexible Node.js web application framework. (Currently `~4.5.0`)
*   **WebSockets:** Via `shoe`, used for communication.
*   **node-pty:** A module for pseudo-terminal support in Node.js. (Replaced `pty.js`)
*   **term.js:** A terminal emulator for the browser. (Original version `0.0.4`)
*   **Browserify:** Used for client-side script bundling. (Currently `~4.2.0`)

## Installation

After the initial modernization (replacement of `pty.js` with `node-pty`), you can install dependencies using:

```bash
npm install
```

This should now work on modern Node.js versions (tested on v18).

## Running the Project

To start the server (after installation):

```bash
npm start
```

or

```bash
node server.js
```

The application will then be accessible at **[http://localhost:3000](http://localhost:3000)** (note the port change).

## Further Dependency Modernization

While the critical `pty.js` dependency was replaced to restore core functionality, many other dependencies in `package.json` (e.g., Express, Browserify, term.js, shoe, emit-stream, mux-demux, JSONStream) are quite old.

Attempts to update these other dependencies systematically (e.g., using `npm outdated` and then `npm install <package>@latest`) during the refactoring process were **hindered by persistent timeouts of `npm` commands** (`npm outdated`, `npm install`, `npm list`) within the development environment used. This prevented a thorough update and testing of each non-critical dependency.

It is recommended to:
1.  Re-evaluate these older dependencies for security vulnerabilities and compatibility.
2.  Attempt to update them in a stable development environment where `npm` commands function reliably.
3.  Thoroughly test the application after each update, as some very old packages like `term.js` or `shoe` might have significant API changes in newer versions or lack direct modern equivalents, potentially requiring further code refactoring.

Updating these dependencies would be beneficial for security, performance, and long-term maintainability.
