// Copyright 2018-2025 the Deno authors. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="deno.net" />

/** Deno provides extra properties on `import.meta`. These are included here
 * to ensure that these are still available when using the Deno namespace in
 * conjunction with other type libs, like `dom`.
 *
 * @category Platform
 */
interface ImportMeta {
  /** A string representation of the fully qualified module URL. When the
   * module is loaded locally, the value will be a file URL (e.g.
   * `file:///path/module.ts`).
   *
   * You can also parse the string as a URL to determine more information about
   * how the current module was loaded. For example to determine if a module was
   * local or not:
   *
   * ```ts
   * const url = new URL(import.meta.url);
   * if (url.protocol === "file:") {
   *   console.log("this module was loaded locally");
   * }
   * ```
   */
  url: string;

  /** The absolute path of the current module.
   *
   * This property is only provided for local modules (ie. using `file://` URLs).
   *
   * Example:
   * ```
   * // Unix
   * console.log(import.meta.filename); // /home/alice/my_module.ts
   *
   * // Windows
   * console.log(import.meta.filename); // C:\alice\my_module.ts
   * ```
   */
  filename?: string;

  /** The absolute path of the directory containing the current module.
   *
   * This property is only provided for local modules (ie. using `file://` URLs).
   *
   * * Example:
   * ```
   * // Unix
   * console.log(import.meta.dirname); // /home/alice
   *
   * // Windows
   * console.log(import.meta.dirname); // C:\alice
   * ```
   */
  dirname?: string;

  /** A flag that indicates if the current module is the main module that was
   * called when starting the program under Deno.
   *
   * ```ts
   * if (import.meta.main) {
   *   // this was loaded as the main module, maybe do some bootstrapping
   * }
   * ```
   */
  main: boolean;

  /** A function that returns resolved specifier as if it would be imported
   * using `import(specifier)`.
   *
   * ```ts
   * console.log(import.meta.resolve("./foo.js"));
   * // file:///dev/foo.js
   * ```
   */
  resolve(specifier: string): string;
}

/** Deno supports [User Timing Level 3](https://w3c.github.io/user-timing)
 * which is not widely supported yet in other runtimes.
 *
 * Check out the
 * [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
 * documentation on MDN for further information about how to use the API.
 *
 * @category Performance
 */
interface Performance {
  /** Stores a timestamp with the associated name (a "mark"). */
  mark(markName: string, options?: PerformanceMarkOptions): PerformanceMark;

  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(
    measureName: string,
    options?: PerformanceMeasureOptions,
  ): PerformanceMeasure;
}

/**
 * Options which are used in conjunction with `performance.mark`. Check out the
 * MDN
 * [`performance.mark()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark#markoptions)
 * documentation for more details.
 *
 * @category Performance
 */
interface PerformanceMarkOptions {
  /** Metadata to be included in the mark. */
  // deno-lint-ignore no-explicit-any
  detail?: any;

  /** Timestamp to be used as the mark time. */
  startTime?: number;
}

/**
 * Options which are used in conjunction with `performance.measure`. Check out the
 * MDN
 * [`performance.mark()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure#measureoptions)
 * documentation for more details.
 *
 * @category Performance
 */
interface PerformanceMeasureOptions {
  /** Metadata to be included in the measure. */
  // deno-lint-ignore no-explicit-any
  detail?: any;

  /** Timestamp to be used as the start time or string to be used as start
   * mark. */
  start?: string | number;

  /** Duration between the start and end times. */
  duration?: number;

  /** Timestamp to be used as the end time or string to be used as end mark. */
  end?: string | number;
}

/** The global namespace where Deno specific, non-standard APIs are located. */
declare namespace Deno {
  /** A set of error constructors that are raised by Deno APIs.
   *
   * Can be used to provide more specific handling of failures within code
   * which is using Deno APIs. For example, handling attempting to open a file
   * which does not exist:
   *
   * ```ts
   * try {
   *   const file = await Deno.open("./some/file.txt");
   * } catch (error) {
   *   if (error instanceof Deno.errors.NotFound) {
   *     console.error("the file was not found");
   *   } else {
   *     // otherwise re-throw
   *     throw error;
   *   }
   * }
   * ```
   *
   * @category Errors
   */
  export namespace errors {
    /**
     * Raised when the underlying operating system indicates that the file
     * was not found.
     *
     * @category Errors */
    export class NotFound extends Error {}
    /**
     * Raised when the underlying operating system indicates the current user
     * which the Deno process is running under does not have the appropriate
     * permissions to a file or resource.
     *
     * Before Deno 2.0, this error was raised when the user _did not_ provide
     * required `--allow-*` flag. As of Deno 2.0, that case is now handled by
     * the {@link NotCapable} error.
     *
     * @category Errors */
    export class PermissionDenied extends Error {}
    /**
     * Raised when the underlying operating system reports that a connection to
     * a resource is refused.
     *
     * @category Errors */
    export class ConnectionRefused extends Error {}
    /**
     * Raised when the underlying operating system reports that a connection has
     * been reset. With network servers, it can be a _normal_ occurrence where a
     * client will abort a connection instead of properly shutting it down.
     *
     * @category Errors */
    export class ConnectionReset extends Error {}
    /**
     * Raised when the underlying operating system reports an `ECONNABORTED`
     * error.
     *
     * @category Errors */
    export class ConnectionAborted extends Error {}
    /**
     * Raised when the underlying operating system reports an `ENOTCONN` error.
     *
     * @category Errors */
    export class NotConnected extends Error {}
    /**
     * Raised when attempting to open a server listener on an address and port
     * that already has a listener.
     *
     * @category Errors */
    export class AddrInUse extends Error {}
    /**
     * Raised when the underlying operating system reports an `EADDRNOTAVAIL`
     * error.
     *
     * @category Errors */
    export class AddrNotAvailable extends Error {}
    /**
     * Raised when trying to write to a resource and a broken pipe error occurs.
     * This can happen when trying to write directly to `stdout` or `stderr`
     * and the operating system is unable to pipe the output for a reason
     * external to the Deno runtime.
     *
     * @category Errors */
    export class BrokenPipe extends Error {}
    /**
     * Raised when trying to create a resource, like a file, that already
     * exits.
     *
     * @category Errors */
    export class AlreadyExists extends Error {}
    /**
     * Raised when an operation returns data that is invalid for the
     * operation being performed.
     *
     * @category Errors */
    export class InvalidData extends Error {}
    /**
     * Raised when the underlying operating system reports that an I/O operation
     * has timed out (`ETIMEDOUT`).
     *
     * @category Errors */
    export class TimedOut extends Error {}
    /**
     * Raised when the underlying operating system reports an `EINTR` error. In
     * many cases, this underlying IO error will be handled internally within
     * Deno, or result in an {@link BadResource} error instead.
     *
     * @category Errors */
    export class Interrupted extends Error {}
    /**
     * Raised when the underlying operating system would need to block to
     * complete but an asynchronous (non-blocking) API is used.
     *
     * @category Errors */
    export class WouldBlock extends Error {}
    /**
     * Raised when expecting to write to a IO buffer resulted in zero bytes
     * being written.
     *
     * @category Errors */
    export class WriteZero extends Error {}
    /**
     * Raised when attempting to read bytes from a resource, but the EOF was
     * unexpectedly encountered.
     *
     * @category Errors */
    export class UnexpectedEof extends Error {}
    /**
     * The underlying IO resource is invalid or closed, and so the operation
     * could not be performed.
     *
     * @category Errors */
    export class BadResource extends Error {}
    /**
     * Raised in situations where when attempting to load a dynamic import,
     * too many redirects were encountered.
     *
     * @category Errors */
    export class Http extends Error {}
    /**
     * Raised when the underlying IO resource is not available because it is
     * being awaited on in another block of code.
     *
     * @category Errors */
    export class Busy extends Error {}
    /**
     * Raised when the underlying Deno API is asked to perform a function that
     * is not currently supported.
     *
     * @category Errors */
    export class NotSupported extends Error {}
    /**
     * Raised when too many symbolic links were encountered when resolving the
     * filename.
     *
     * @category Errors */
    export class FilesystemLoop extends Error {}
    /**
     * Raised when trying to open, create or write to a directory.
     *
     * @category Errors */
    export class IsADirectory extends Error {}
    /**
     * Raised when performing a socket operation but the remote host is
     * not reachable.
     *
     * @category Errors */
    export class NetworkUnreachable extends Error {}
    /**
     * Raised when trying to perform an operation on a path that is not a
     * directory, when directory is required.
     *
     * @category Errors */
    export class NotADirectory extends Error {}

    /**
     * Raised when trying to perform an operation while the relevant Deno
     * permission (like `--allow-read`) has not been granted.
     *
     * Before Deno 2.0, this condition was covered by the {@link PermissionDenied}
     * error.
     *
     * @category Errors */
    export class NotCapable extends Error {}

    export {}; // only export exports
  }

  /** The current process ID of this instance of the Deno CLI.
   *
   * ```ts
   * console.log(Deno.pid);
   * ```
   *
   * @category Runtime
   */
  export const pid: number;

  /**
   * The process ID of parent process of this instance of the Deno CLI.
   *
   * ```ts
   * console.log(Deno.ppid);
   * ```
   *
   * @category Runtime
   */
  export const ppid: number;

  /** @category Runtime */
  export interface MemoryUsage {
    /** The number of bytes of the current Deno's process resident set size,
     * which is the amount of memory occupied in main memory (RAM). */
    rss: number;
    /** The total size of the heap for V8, in bytes. */
    heapTotal: number;
    /** The amount of the heap used for V8, in bytes. */
    heapUsed: number;
    /** Memory, in bytes, associated with JavaScript objects outside of the
     * JavaScript isolate. */
    external: number;
  }

  /**
   * Returns an object describing the memory usage of the Deno process and the
   * V8 subsystem measured in bytes.
   *
   * @category Runtime
   */
  export function memoryUsage(): MemoryUsage;

  /**
   * Get the `hostname` of the machine the Deno process is running on.
   *
   * ```ts
   * console.log(Deno.hostname());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function hostname(): string;

  /**
   * Returns an array containing the 1, 5, and 15 minute load averages. The
   * load average is a measure of CPU and IO utilization of the last one, five,
   * and 15 minute periods expressed as a fractional number.  Zero means there
   * is no load. On Windows, the three values are always the same and represent
   * the current load, not the 1, 5 and 15 minute load averages.
   *
   * ```ts
   * console.log(Deno.loadavg());  // e.g. [ 0.71, 0.44, 0.44 ]
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * On Windows there is no API available to retrieve this information and this method returns `[ 0, 0, 0 ]`.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function loadavg(): number[];

  /**
   * The information for a network interface returned from a call to
   * {@linkcode Deno.networkInterfaces}.
   *
   * @category Network
   */
  export interface NetworkInterfaceInfo {
    /** The network interface name. */
    name: string;
    /** The IP protocol version. */
    family: "IPv4" | "IPv6";
    /** The IP address bound to the interface. */
    address: string;
    /** The netmask applied to the interface. */
    netmask: string;
    /** The IPv6 scope id or `null`. */
    scopeid: number | null;
    /** The CIDR range. */
    cidr: string;
    /** The MAC address. */
    mac: string;
  }

  /**
   * Returns an array of the network interface information.
   *
   * ```ts
   * console.log(Deno.networkInterfaces());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Network
   */
  export function networkInterfaces(): NetworkInterfaceInfo[];

  /**
   * Displays the total amount of free and used physical and swap memory in the
   * system, as well as the buffers and caches used by the kernel.
   *
   * This is similar to the `free` command in Linux
   *
   * ```ts
   * console.log(Deno.systemMemoryInfo());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function systemMemoryInfo(): SystemMemoryInfo;

  /**
   * Information returned from a call to {@linkcode Deno.systemMemoryInfo}.
   *
   * @category Runtime
   */
  export interface SystemMemoryInfo {
    /** Total installed memory in bytes. */
    total: number;
    /** Unused memory in bytes. */
    free: number;
    /** Estimation of how much memory, in bytes, is available for starting new
     * applications, without swapping. Unlike the data provided by the cache or
     * free fields, this field takes into account page cache and also that not
     * all reclaimable memory will be reclaimed due to items being in use.
     */
    available: number;
    /** Memory used by kernel buffers. */
    buffers: number;
    /** Memory used by the page cache and slabs. */
    cached: number;
    /** Total swap memory. */
    swapTotal: number;
    /** Unused swap memory. */
    swapFree: number;
  }

  /** Reflects the `NO_COLOR` environment variable at program start.
   *
   * When the value is `true`, the Deno CLI will attempt to not send color codes
   * to `stderr` or `stdout` and other command line programs should also attempt
   * to respect this value.
   *
   * See: https://no-color.org/
   *
   * @category Runtime
   */
  export const noColor: boolean;

  /**
   * Returns the release version of the Operating System.
   *
   * ```ts
   * console.log(Deno.osRelease());
   * ```
   *
   * Requires `allow-sys` permission.
   * Under consideration to possibly move to Deno.build or Deno.versions and if
   * it should depend sys-info, which may not be desirable.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function osRelease(): string;

  /**
   * Returns the Operating System uptime in number of seconds.
   *
   * ```ts
   * console.log(Deno.osUptime());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function osUptime(): number;

  /**
   * Options which define the permissions within a test or worker context.
   *
   * `"inherit"` ensures that all permissions of the parent process will be
   * applied to the test context. `"none"` ensures the test context has no
   * permissions. A `PermissionOptionsObject` provides a more specific
   * set of permissions to the test context.
   *
   * @category Permissions */
  export type PermissionOptions = "inherit" | "none" | PermissionOptionsObject;

  /**
   * A set of options which can define the permissions within a test or worker
   * context at a highly specific level.
   *
   * @category Permissions */
  export interface PermissionOptionsObject {
    /** Specifies if the `env` permission should be requested or revoked.
     * If set to `"inherit"`, the current `env` permission will be inherited.
     * If set to `true`, the global `env` permission will be requested.
     * If set to `false`, the global `env` permission will be revoked.
     *
     * @default {false}
     */
    env?: "inherit" | boolean | string[];

    /** Specifies if the `ffi` permission should be requested or revoked.
     * If set to `"inherit"`, the current `ffi` permission will be inherited.
     * If set to `true`, the global `ffi` permission will be requested.
     * If set to `false`, the global `ffi` permission will be revoked.
     *
     * @default {false}
     */
    ffi?: "inherit" | boolean | Array<string | URL>;

    /** Specifies if the `import` permission should be requested or revoked.
     * If set to `"inherit"` the current `import` permission will be inherited.
     * If set to `true`, the global `import` permission will be requested.
     * If set to `false`, the global `import` permission will be revoked.
     * If set to `Array<string>`, the `import` permissions will be requested with the
     * specified domains.
     */
    import?: "inherit" | boolean | Array<string>;

    /** Specifies if the `net` permission should be requested or revoked.
     * if set to `"inherit"`, the current `net` permission will be inherited.
     * if set to `true`, the global `net` permission will be requested.
     * if set to `false`, the global `net` permission will be revoked.
     * if set to `string[]`, the `net` permission will be requested with the
     * specified host strings with the format `"<host>[:<port>]`.
     *
     * @default {false}
     *
     * Examples:
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "inherit",
     *   permissions: {
     *     net: "inherit",
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net" })
     *     assertEquals(status.state, "granted");
     *   },
     * });
     * ```
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "true",
     *   permissions: {
     *     net: true,
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net" });
     *     assertEquals(status.state, "granted");
     *   },
     * });
     * ```
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "false",
     *   permissions: {
     *     net: false,
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net" });
     *     assertEquals(status.state, "denied");
     *   },
     * });
     * ```
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "localhost:8080",
     *   permissions: {
     *     net: ["localhost:8080"],
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net", host: "localhost:8080" });
     *     assertEquals(status.state, "granted");
     *   },
     * });
     * ```
     */
    net?: "inherit" | boolean | string[];

    /** Specifies if the `read` permission should be requested or revoked.
     * If set to `"inherit"`, the current `read` permission will be inherited.
     * If set to `true`, the global `read` permission will be requested.
     * If set to `false`, the global `read` permission will be revoked.
     * If set to `Array<string | URL>`, the `read` permission will be requested with the
     * specified file paths.
     *
     * @default {false}
     */
    read?: "inherit" | boolean | Array<string | URL>;

    /** Specifies if the `run` permission should be requested or revoked.
     * If set to `"inherit"`, the current `run` permission will be inherited.
     * If set to `true`, the global `run` permission will be requested.
     * If set to `false`, the global `run` permission will be revoked.
     *
     * @default {false}
     */
    run?: "inherit" | boolean | Array<string | URL>;

    /** Specifies if the `sys` permission should be requested or revoked.
     * If set to `"inherit"`, the current `sys` permission will be inherited.
     * If set to `true`, the global `sys` permission will be requested.
     * If set to `false`, the global `sys` permission will be revoked.
     *
     * @default {false}
     */
    sys?: "inherit" | boolean | string[];

    /** Specifies if the `write` permission should be requested or revoked.
     * If set to `"inherit"`, the current `write` permission will be inherited.
     * If set to `true`, the global `write` permission will be requested.
     * If set to `false`, the global `write` permission will be revoked.
     * If set to `Array<string | URL>`, the `write` permission will be requested with the
     * specified file paths.
     *
     * @default {false}
     */
    write?: "inherit" | boolean | Array<string | URL>;
  }

  /**
   * Context that is passed to a testing function, which can be used to either
   * gain information about the current test, or register additional test
   * steps within the current test.
   *
   * @category Testing */
  export interface TestContext {
    /** The current test name. */
    name: string;
    /** The string URL of the current test. */
    origin: string;
    /** If the current test is a step of another test, the parent test context
     * will be set here. */
    parent?: TestContext;

    /** Run a sub step of the parent test or step. Returns a promise
     * that resolves to a boolean signifying if the step completed successfully.
     *
     * The returned promise never rejects unless the arguments are invalid.
     *
     * If the test was ignored the promise returns `false`.
     *
     * ```ts
     * Deno.test({
     *   name: "a parent test",
     *   async fn(t) {
     *     console.log("before the step");
     *     await t.step({
     *       name: "step 1",
     *       fn(t) {
     *         console.log("current step:", t.name);
     *       }
     *     });
     *     console.log("after the step");
     *   }
     * });
     * ```
     */
    step(definition: TestStepDefinition): Promise<boolean>;

    /** Run a sub step of the parent test or step. Returns a promise
     * that resolves to a boolean signifying if the step completed successfully.
     *
     * The returned promise never rejects unless the arguments are invalid.
     *
     * If the test was ignored the promise returns `false`.
     *
     * ```ts
     * Deno.test(
     *   "a parent test",
     *   async (t) => {
     *     console.log("before the step");
     *     await t.step(
     *       "step 1",
     *       (t) => {
     *         console.log("current step:", t.name);
     *       }
     *     );
     *     console.log("after the step");
     *   }
     * );
     * ```
     */
    step(
      name: string,
      fn: (t: TestContext) => void | Promise<void>,
    ): Promise<boolean>;

    /** Run a sub step of the parent test or step. Returns a promise
     * that resolves to a boolean signifying if the step completed successfully.
     *
     * The returned promise never rejects unless the arguments are invalid.
     *
     * If the test was ignored the promise returns `false`.
     *
     * ```ts
     * Deno.test(async function aParentTest(t) {
     *   console.log("before the step");
     *   await t.step(function step1(t) {
     *     console.log("current step:", t.name);
     *   });
     *   console.log("after the step");
     * });
     * ```
     */
    step(fn: (t: TestContext) => void | Promise<void>): Promise<boolean>;
  }

  /** @category Testing */
  export interface TestStepDefinition {
    /** The test function that will be tested when this step is executed. The
     * function can take an argument which will provide information about the
     * current step's context. */
    fn: (t: TestContext) => void | Promise<void>;
    /** The name of the step. */
    name: string;
    /** If truthy the current test step will be ignored.
     *
     * This is a quick way to skip over a step, but also can be used for
     * conditional logic, like determining if an environment feature is present.
     */
    ignore?: boolean;
    /** Check that the number of async completed operations after the test step
     * is the same as number of dispatched operations. This ensures that the
     * code tested does not start async operations which it then does
     * not await. This helps in preventing logic errors and memory leaks
     * in the application code.
     *
     * Defaults to the parent test or step's value. */
    sanitizeOps?: boolean;
    /** Ensure the test step does not "leak" resources - like open files or
     * network connections - by ensuring the open resources at the start of the
     * step match the open resources at the end of the step.
     *
     * Defaults to the parent test or step's value. */
    sanitizeResources?: boolean;
    /** Ensure the test step does not prematurely cause the process to exit,
     * for example via a call to {@linkcode Deno.exit}.
     *
     * Defaults to the parent test or step's value. */
    sanitizeExit?: boolean;
  }

  /** @category Testing */
  export interface TestDefinition {
    fn: (t: TestContext) => void | Promise<void>;
    /** The name of the test. */
    name: string;
    /** If truthy the current test step will be ignored.
     *
     * It is a quick way to skip over a step, but also can be used for
     * conditional logic, like determining if an environment feature is present.
     */
    ignore?: boolean;
    /** If at least one test has `only` set to `true`, only run tests that have
     * `only` set to `true` and fail the test suite. */
    only?: boolean;
    /** Check that the number of async completed operations after the test step
     * is the same as number of dispatched operations. This ensures that the
     * code tested does not start async operations which it then does
     * not await. This helps in preventing logic errors and memory leaks
     * in the application code.
     *
     * @default {true} */
    sanitizeOps?: boolean;
    /** Ensure the test step does not "leak" resources - like open files or
     * network connections - by ensuring the open resources at the start of the
     * test match the open resources at the end of the test.
     *
     * @default {true} */
    sanitizeResources?: boolean;
    /** Ensure the test case does not prematurely cause the process to exit,
     * for example via a call to {@linkcode Deno.exit}.
     *
     * @default {true} */
    sanitizeExit?: boolean;
    /** Specifies the permissions that should be used to run the test.
     *
     * Set this to "inherit" to keep the calling runtime permissions, set this
     * to "none" to revoke all permissions, or set a more specific set of
     * permissions using a {@linkcode PermissionOptionsObject}.
     *
     * @default {"inherit"} */
    permissions?: PermissionOptions;
  }

  /** Register a test which will be run when `deno test` is used on the command
   * line and the containing module looks like a test module.
   *
   * `fn` can be async if required.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.test({
   *   name: "example test",
   *   fn() {
   *     assertEquals("world", "world");
   *   },
   * });
   *
   * Deno.test({
   *   name: "example ignored test",
   *   ignore: Deno.build.os === "windows",
   *   fn() {
   *     // This test is ignored only on Windows machines
   *   },
   * });
   *
   * Deno.test({
   *   name: "example async test",
   *   async fn() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * });
   * ```
   *
   * @category Testing
   */
  export const test: DenoTest;

  /**
   * @category Testing
   */
  export interface DenoTest {
    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "example test",
     *   fn() {
     *     assertEquals("world", "world");
     *   },
     * });
     *
     * Deno.test({
     *   name: "example ignored test",
     *   ignore: Deno.build.os === "windows",
     *   fn() {
     *     // This test is ignored only on Windows machines
     *   },
     * });
     *
     * Deno.test({
     *   name: "example async test",
     *   async fn() {
     *     const decoder = new TextDecoder("utf-8");
     *     const data = await Deno.readFile("hello_world.txt");
     *     assertEquals(decoder.decode(data), "Hello world");
     *   }
     * });
     * ```
     *
     * @category Testing
     */
    (t: TestDefinition): void;

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test("My test description", () => {
     *   assertEquals("hello", "hello");
     * });
     *
     * Deno.test("My async test description", async () => {
     *   const decoder = new TextDecoder("utf-8");
     *   const data = await Deno.readFile("hello_world.txt");
     *   assertEquals(decoder.decode(data), "Hello world");
     * });
     * ```
     *
     * @category Testing
     */
    (name: string, fn: (t: TestContext) => void | Promise<void>): void;

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required. Declared function must have a name.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test(function myTestName() {
     *   assertEquals("hello", "hello");
     * });
     *
     * Deno.test(async function myOtherTestName() {
     *   const decoder = new TextDecoder("utf-8");
     *   const data = await Deno.readFile("hello_world.txt");
     *   assertEquals(decoder.decode(data), "Hello world");
     * });
     * ```
     *
     * @category Testing
     */
    (fn: (t: TestContext) => void | Promise<void>): void;

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assert, fail, assertEquals } from "jsr:@std/assert";
     *
     * Deno.test("My test description", { permissions: { read: true } }, (): void => {
     *   assertEquals("hello", "hello");
     * });
     *
     * Deno.test("My async test description", { permissions: { read: false } }, async (): Promise<void> => {
     *   const decoder = new TextDecoder("utf-8");
     *   const data = await Deno.readFile("hello_world.txt");
     *   assertEquals(decoder.decode(data), "Hello world");
     * });
     * ```
     *
     * @category Testing
     */
    (
      name: string,
      options: Omit<TestDefinition, "fn" | "name">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test(
     *   {
     *     name: "My test description",
     *     permissions: { read: true },
     *   },
     *   () => {
     *     assertEquals("hello", "hello");
     *   },
     * );
     *
     * Deno.test(
     *   {
     *     name: "My async test description",
     *     permissions: { read: false },
     *   },
     *   async () => {
     *     const decoder = new TextDecoder("utf-8");
     *     const data = await Deno.readFile("hello_world.txt");
     *     assertEquals(decoder.decode(data), "Hello world");
     *   },
     * );
     * ```
     *
     * @category Testing
     */
    (
      options: Omit<TestDefinition, "fn" | "name">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required. Declared function must have a name.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test(
     *   { permissions: { read: true } },
     *   function myTestName() {
     *     assertEquals("hello", "hello");
     *   },
     * );
     *
     * Deno.test(
     *   { permissions: { read: false } },
     *   async function myOtherTestName() {
     *     const decoder = new TextDecoder("utf-8");
     *     const data = await Deno.readFile("hello_world.txt");
     *     assertEquals(decoder.decode(data), "Hello world");
     *   },
     * );
     * ```
     *
     * @category Testing
     */
    (
      options: Omit<TestDefinition, "fn">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(t: Omit<TestDefinition, "ignore">): void;

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(name: string, fn: (t: TestContext) => void | Promise<void>): void;

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(fn: (t: TestContext) => void | Promise<void>): void;

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(
      name: string,
      options: Omit<TestDefinition, "fn" | "name" | "ignore">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(
      options: Omit<TestDefinition, "fn" | "name" | "ignore">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(
      options: Omit<TestDefinition, "fn" | "ignore">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(t: Omit<TestDefinition, "only">): void;

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(name: string, fn: (t: TestContext) => void | Promise<void>): void;

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(fn: (t: TestContext) => void | Promise<void>): void;

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(
      name: string,
      options: Omit<TestDefinition, "fn" | "name" | "only">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(
      options: Omit<TestDefinition, "fn" | "name" | "only">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(
      options: Omit<TestDefinition, "fn" | "only">,
      fn: (t: TestContext) => void | Promise<void>,
    ): void;

    /** Register a function to be called before all tests in the current scope.
     *
     * These functions are run in FIFO order (first in, first out).
     *
     * If an exception is raised during execution of this hook, the remaining `beforeAll` hooks will not be run.
     *
     * ```ts
     * Deno.test.beforeAll(() => {
     *   // Setup code that runs once before all tests
     *   console.log("Setting up test suite");
     * });
     * ```
     *
     * @category Testing
     */
    beforeAll(
      fn: () => void | Promise<void>,
    ): void;

    /** Register a function to be called before each test in the current scope.
     *
     * These functions are run in FIFO order (first in, first out).
     *
     * If an exception is raised during execution of this hook, the remaining hooks will not be run and the currently running
     * test case will be marked as failed.
     *
     * ```ts
     * Deno.test.beforeEach(() => {
     *   // Setup code that runs before each test
     *   console.log("Setting up test");
     * });
     * ```
     *
     * @category Testing
     */
    beforeEach(fn: () => void | Promise<void>): void;

    /** Register a function to be called after each test in the current scope.
     *
     * These functions are run in LIFO order (last in, first out).
     *
     * If an exception is raised during execution of this hook, the remaining hooks will not be run and the currently running
     * test case will be marked as failed.
     *
     * ```ts
     * Deno.test.afterEach(() => {
     *   // Cleanup code that runs after each test
     *   console.log("Cleaning up test");
     * });
     * ```
     *
     * @category Testing
     */
    afterEach(fn: () => void | Promise<void>): void;

    /** Register a function to be called after all tests in the current scope have finished running.
     *
     * These functions are run in the LIFO order (last in, first out).
     *
     * If an exception is raised during execution of this hook, the remaining `afterAll` hooks will not be run.
     *
     * ```ts
     * Deno.test.afterAll(() => {
     *   // Cleanup code that runs once after all tests
     *   console.log("Cleaning up test suite");
     * });
     * ```
     *
     * @category Testing
     */
    afterAll(fn: () => void | Promise<void>): void;
  }

  /**
   * Context that is passed to a benchmarked function. The instance is shared
   * between iterations of the benchmark. Its methods can be used for example
   * to override of the measured portion of the function.
   *
   * @category Testing
   */
  export interface BenchContext {
    /** The current benchmark name. */
    name: string;
    /** The string URL of the current benchmark. */
    origin: string;

    /** Restarts the timer for the bench measurement. This should be called
     * after doing setup work which should not be measured.
     *
     * Warning: This method should not be used for benchmarks averaging less
     * than 10μs per iteration. In such cases it will be disabled but the call
     * will still have noticeable overhead, resulting in a warning.
     *
     * ```ts
     * Deno.bench("foo", async (t) => {
     *   const data = await Deno.readFile("data.txt");
     *   t.start();
     *   // some operation on `data`...
     * });
     * ```
     */
    start(): void;

    /** End the timer early for the bench measurement. This should be called
     * before doing teardown work which should not be measured.
     *
     * Warning: This method should not be used for benchmarks averaging less
     * than 10μs per iteration. In such cases it will be disabled but the call
     * will still have noticeable overhead, resulting in a warning.
     *
     * ```ts
     * Deno.bench("foo", async (t) => {
     *   using file = await Deno.open("data.txt");
     *   t.start();
     *   // some operation on `file`...
     *   t.end();
     * });
     * ```
     */
    end(): void;
  }

  /**
   * The interface for defining a benchmark test using {@linkcode Deno.bench}.
   *
   * @category Testing
   */
  export interface BenchDefinition {
    /** The test function which will be benchmarked. */
    fn: (b: BenchContext) => void | Promise<void>;
    /** The name of the test, which will be used in displaying the results. */
    name: string;
    /** If truthy, the benchmark test will be ignored/skipped. */
    ignore?: boolean;
    /** Group name for the benchmark.
     *
     * Grouped benchmarks produce a group time summary, where the difference
     * in performance between each test of the group is compared. */
    group?: string;
    /** Benchmark should be used as the baseline for other benchmarks.
     *
     * If there are multiple baselines in a group, the first one is used as the
     * baseline. */
    baseline?: boolean;
    /** If at least one bench has `only` set to true, only run benches that have
     * `only` set to `true` and fail the bench suite. */
    only?: boolean;
    /** Number of iterations to perform.
     * @remarks When the benchmark is very fast, this will only be used as a
     * suggestion in order to get a more accurate measurement.
     */
    n?: number;
    /** Number of warmups to do before running the benchmark.
     * @remarks A warmup will always be performed even if this is `0` in order to
     * determine the speed of the benchmark in order to improve the measurement. When
     * the benchmark is very fast, this will be used as a suggestion.
     */
    warmup?: number;
    /** Ensure the bench case does not prematurely cause the process to exit,
     * for example via a call to {@linkcode Deno.exit}.
     *
     * @default {true} */
    sanitizeExit?: boolean;
    /** Specifies the permissions that should be used to run the bench.
     *
     * Set this to `"inherit"` to keep the calling thread's permissions.
     *
     * Set this to `"none"` to revoke all permissions.
     *
     * @default {"inherit"}
     */
    permissions?: PermissionOptions;
  }

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench({
   *   name: "example test",
   *   fn() {
   *     assertEquals("world", "world");
   *   },
   * });
   *
   * Deno.bench({
   *   name: "example ignored test",
   *   ignore: Deno.build.os === "windows",
   *   fn() {
   *     // This test is ignored only on Windows machines
   *   },
   * });
   *
   * Deno.bench({
   *   name: "example async test",
   *   async fn() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * });
   * ```
   *
   * @category Testing
   */
  export function bench(b: BenchDefinition): void;

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench("My test description", () => {
   *   assertEquals("hello", "hello");
   * });
   *
   * Deno.bench("My async test description", async () => {
   *   const decoder = new TextDecoder("utf-8");
   *   const data = await Deno.readFile("hello_world.txt");
   *   assertEquals(decoder.decode(data), "Hello world");
   * });
   * ```
   *
   * @category Testing
   */
  export function bench(
    name: string,
    fn: (b: BenchContext) => void | Promise<void>,
  ): void;

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(function myTestName() {
   *   assertEquals("hello", "hello");
   * });
   *
   * Deno.bench(async function myOtherTestName() {
   *   const decoder = new TextDecoder("utf-8");
   *   const data = await Deno.readFile("hello_world.txt");
   *   assertEquals(decoder.decode(data), "Hello world");
   * });
   * ```
   *
   * @category Testing
   */
  export function bench(fn: (b: BenchContext) => void | Promise<void>): void;

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(
   *   "My test description",
   *   { permissions: { read: true } },
   *   () => {
   *    assertEquals("hello", "hello");
   *   }
   * );
   *
   * Deno.bench(
   *   "My async test description",
   *   { permissions: { read: false } },
   *   async () => {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * );
   * ```
   *
   * @category Testing
   */
  export function bench(
    name: string,
    options: Omit<BenchDefinition, "fn" | "name">,
    fn: (b: BenchContext) => void | Promise<void>,
  ): void;

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(
   *   { name: "My test description", permissions: { read: true } },
   *   () => {
   *     assertEquals("hello", "hello");
   *   }
   * );
   *
   * Deno.bench(
   *   { name: "My async test description", permissions: { read: false } },
   *   async () => {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * );
   * ```
   *
   * @category Testing
   */
  export function bench(
    options: Omit<BenchDefinition, "fn">,
    fn: (b: BenchContext) => void | Promise<void>,
  ): void;

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(
   *   { permissions: { read: true } },
   *   function myTestName() {
   *     assertEquals("hello", "hello");
   *   }
   * );
   *
   * Deno.bench(
   *   { permissions: { read: false } },
   *   async function myOtherTestName() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * );
   * ```
   *
   * @category Testing
   */
  export function bench(
    options: Omit<BenchDefinition, "fn" | "name">,
    fn: (b: BenchContext) => void | Promise<void>,
  ): void;

  /** Exit the Deno process with optional exit code.
   *
   * If no exit code is supplied then Deno will exit with return code of `0`.
   *
   * In worker contexts this is an alias to `self.close();`.
   *
   * ```ts
   * Deno.exit(5);
   * ```
   *
   * @category Runtime
   */
  export function exit(code?: number): never;

  /** The exit code for the Deno process.
   *
   * If no exit code has been supplied, then Deno will assume a return code of `0`.
   *
   * When setting an exit code value, a number or non-NaN string must be provided,
   * otherwise a TypeError will be thrown.
   *
   * ```ts
   * console.log(Deno.exitCode); //-> 0
   * Deno.exitCode = 1;
   * console.log(Deno.exitCode); //-> 1
   * ```
   *
   * @category Runtime
   */
  export var exitCode: number;

  /** An interface containing methods to interact with the process environment
   * variables.
   *
   * @tags allow-env
   * @category Runtime
   */
  export interface Env {
    /** Retrieve the value of an environment variable.
     *
     * Returns `undefined` if the supplied environment variable is not defined.
     *
     * ```ts
     * console.log(Deno.env.get("HOME"));  // e.g. outputs "/home/alice"
     * console.log(Deno.env.get("MADE_UP_VAR"));  // outputs undefined
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    get(key: string): string | undefined;

    /** Set the value of an environment variable.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value");
     * Deno.env.get("SOME_VAR");  // outputs "Value"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    set(key: string, value: string): void;

    /** Delete the value of an environment variable.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value");
     * Deno.env.delete("SOME_VAR");  // outputs "undefined"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    delete(key: string): void;

    /** Check whether an environment variable is present or not.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value");
     * Deno.env.has("SOME_VAR");  // outputs true
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    has(key: string): boolean;

    /** Returns a snapshot of the environment variables at invocation as a
     * simple object of keys and values.
     *
     * ```ts
     * Deno.env.set("TEST_VAR", "A");
     * const myEnv = Deno.env.toObject();
     * console.log(myEnv.SHELL);
     * Deno.env.set("TEST_VAR", "B");
     * console.log(myEnv.TEST_VAR);  // outputs "A"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    toObject(): { [index: string]: string };
  }

  /** An interface containing methods to interact with the process environment
   * variables.
   *
   * @tags allow-env
   * @category Runtime
   */
  export const env: Env;

  /**
   * Returns the path to the current deno executable.
   *
   * ```ts
   * console.log(Deno.execPath());  // e.g. "/home/alice/.local/bin/deno"
   * ```
   *
   * @category Runtime
   */
  export function execPath(): string;

  /**
   * Change the current working directory to the specified path.
   *
   * ```ts
   * Deno.chdir("/home/userA");
   * Deno.chdir("../userB");
   * Deno.chdir("C:\\Program Files (x86)\\Java");
   * ```
   *
   * Throws {@linkcode Deno.errors.NotFound} if directory not found.
   *
   * Throws {@linkcode Deno.errors.PermissionDenied} if the user does not have
   * operating system file access rights.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category Runtime
   */
  export function chdir(directory: string | URL): void;

  /**
   * Return a string representing the current working directory.
   *
   * If the current directory can be reached via multiple paths (due to symbolic
   * links), `cwd()` may return any one of them.
   *
   * ```ts
   * const currentWorkingDirectory = Deno.cwd();
   * ```
   *
   * Throws {@linkcode Deno.errors.NotFound} if directory not available.
   *
   * @category Runtime
   */
  export function cwd(): string;

  /**
   * Creates `newpath` as a hard link to `oldpath`.
   *
   * ```ts
   * await Deno.link("old/name", "new/name");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function link(oldpath: string, newpath: string): Promise<void>;

  /**
   * Synchronously creates `newpath` as a hard link to `oldpath`.
   *
   * ```ts
   * Deno.linkSync("old/name", "new/name");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function linkSync(oldpath: string, newpath: string): void;

  /**
   * A enum which defines the seek mode for IO related APIs that support
   * seeking.
   *
   * @category I/O */
  export enum SeekMode {
    /* Seek from the start of the file/resource. */
    Start = 0,
    /* Seek from the current position within the file/resource. */
    Current = 1,
    /* Seek from the end of the current file/resource. */
    End = 2,
  }

  /** Open a file and resolve to an instance of {@linkcode Deno.FsFile}. The
   * file does not need to previously exist if using the `create` or `createNew`
   * open options. The caller may have the resulting file automatically closed
   * by the runtime once it's out of scope by declaring the file variable with
   * the `using` keyword.
   *
   * ```ts
   * using file = await Deno.open("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * ```
   *
   * Alternatively, the caller may manually close the resource when finished with
   * it.
   *
   * ```ts
   * const file = await Deno.open("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * file.close();
   * ```
   *
   * Requires `allow-read` and/or `allow-write` permissions depending on
   * options.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function open(
    path: string | URL,
    options?: OpenOptions,
  ): Promise<FsFile>;

  /** Synchronously open a file and return an instance of
   * {@linkcode Deno.FsFile}. The file does not need to previously exist if
   * using the `create` or `createNew` open options. The caller may have the
   * resulting file automatically closed by the runtime once it's out of scope
   * by declaring the file variable with the `using` keyword.
   *
   * ```ts
   * using file = Deno.openSync("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * ```
   *
   * Alternatively, the caller may manually close the resource when finished with
   * it.
   *
   * ```ts
   * const file = Deno.openSync("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * file.close();
   * ```
   *
   * Requires `allow-read` and/or `allow-write` permissions depending on
   * options.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function openSync(path: string | URL, options?: OpenOptions): FsFile;

  /** Creates a file if none exists or truncates an existing file and resolves to
   *  an instance of {@linkcode Deno.FsFile}.
   *
   * ```ts
   * const file = await Deno.create("/foo/bar.txt");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function create(path: string | URL): Promise<FsFile>;

  /** Creates a file if none exists or truncates an existing file and returns
   *  an instance of {@linkcode Deno.FsFile}.
   *
   * ```ts
   * const file = Deno.createSync("/foo/bar.txt");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function createSync(path: string | URL): FsFile;

  /** The Deno abstraction for reading and writing files.
   *
   * This is the most straight forward way of handling files within Deno and is
   * recommended over using the discrete functions within the `Deno` namespace.
   *
   * ```ts
   * using file = await Deno.open("/foo/bar.txt", { read: true });
   * const fileInfo = await file.stat();
   * if (fileInfo.isFile) {
   *   const buf = new Uint8Array(100);
   *   const numberOfBytesRead = await file.read(buf); // 11 bytes
   *   const text = new TextDecoder().decode(buf);  // "hello world"
   * }
   * ```
   *
   * @category File System
   */
  export class FsFile implements Disposable {
    /** A {@linkcode ReadableStream} instance representing to the byte contents
     * of the file. This makes it easy to interoperate with other web streams
     * based APIs.
     *
     * ```ts
     * using file = await Deno.open("my_file.txt", { read: true });
     * const decoder = new TextDecoder();
     * for await (const chunk of file.readable) {
     *   console.log(decoder.decode(chunk));
     * }
     * ```
     */
    readonly readable: ReadableStream<Uint8Array<ArrayBuffer>>;
    /** A {@linkcode WritableStream} instance to write the contents of the
     * file. This makes it easy to interoperate with other web streams based
     * APIs.
     *
     * ```ts
     * const items = ["hello", "world"];
     * using file = await Deno.open("my_file.txt", { write: true });
     * const encoder = new TextEncoder();
     * const writer = file.writable.getWriter();
     * for (const item of items) {
     *   await writer.write(encoder.encode(item));
     * }
     * ```
     */
    readonly writable: WritableStream<Uint8Array<ArrayBufferLike>>;
    /** Write the contents of the array buffer (`p`) to the file.
     *
     * Resolves to the number of bytes written.
     *
     * **It is not guaranteed that the full buffer will be written in a single
     * call.**
     *
     * ```ts
     * const encoder = new TextEncoder();
     * const data = encoder.encode("Hello world");
     * using file = await Deno.open("/foo/bar.txt", { write: true });
     * const bytesWritten = await file.write(data); // 11
     * ```
     *
     * @category I/O
     */
    write(p: Uint8Array): Promise<number>;
    /** Synchronously write the contents of the array buffer (`p`) to the file.
     *
     * Returns the number of bytes written.
     *
     * **It is not guaranteed that the full buffer will be written in a single
     * call.**
     *
     * ```ts
     * const encoder = new TextEncoder();
     * const data = encoder.encode("Hello world");
     * using file = Deno.openSync("/foo/bar.txt", { write: true });
     * const bytesWritten = file.writeSync(data); // 11
     * ```
     */
    writeSync(p: Uint8Array): number;
    /** Truncates (or extends) the file to reach the specified `len`. If `len`
     * is not specified, then the entire file contents are truncated.
     *
     * ### Truncate the entire file
     *
     * ```ts
     * using file = await Deno.open("my_file.txt", { write: true });
     * await file.truncate();
     * ```
     *
     * ### Truncate part of the file
     *
     * ```ts
     * // if "my_file.txt" contains the text "hello world":
     * using file = await Deno.open("my_file.txt", { write: true });
     * await file.truncate(7);
     * const buf = new Uint8Array(100);
     * await file.read(buf);
     * const text = new TextDecoder().decode(buf); // "hello w"
     * ```
     */
    truncate(len?: number): Promise<void>;
    /** Synchronously truncates (or extends) the file to reach the specified
     * `len`. If `len` is not specified, then the entire file contents are
     * truncated.
     *
     * ### Truncate the entire file
     *
     * ```ts
     * using file = Deno.openSync("my_file.txt", { write: true });
     * file.truncateSync();
     * ```
     *
     * ### Truncate part of the file
     *
     * ```ts
     * // if "my_file.txt" contains the text "hello world":
     * using file = Deno.openSync("my_file.txt", { write: true });
     * file.truncateSync(7);
     * const buf = new Uint8Array(100);
     * file.readSync(buf);
     * const text = new TextDecoder().decode(buf); // "hello w"
     * ```
     */
    truncateSync(len?: number): void;
    /** Read the file into an array buffer (`p`).
     *
     * Resolves to either the number of bytes read during the operation or EOF
     * (`null`) if there was nothing more to read.
     *
     * It is possible for a read to successfully return with `0` bytes. This
     * does not indicate EOF.
     *
     * **It is not guaranteed that the full buffer will be read in a single
     * call.**
     *
     * ```ts
     * // if "/foo/bar.txt" contains the text "hello world":
     * using file = await Deno.open("/foo/bar.txt");
     * const buf = new Uint8Array(100);
     * const numberOfBytesRead = await file.read(buf); // 11 bytes
     * const text = new TextDecoder().decode(buf);  // "hello world"
     * ```
     */
    read(p: Uint8Array): Promise<number | null>;
    /** Synchronously read from the file into an array buffer (`p`).
     *
     * Returns either the number of bytes read during the operation or EOF
     * (`null`) if there was nothing more to read.
     *
     * It is possible for a read to successfully return with `0` bytes. This
     * does not indicate EOF.
     *
     * **It is not guaranteed that the full buffer will be read in a single
     * call.**
     *
     * ```ts
     * // if "/foo/bar.txt" contains the text "hello world":
     * using file = Deno.openSync("/foo/bar.txt");
     * const buf = new Uint8Array(100);
     * const numberOfBytesRead = file.readSync(buf); // 11 bytes
     * const text = new TextDecoder().decode(buf);  // "hello world"
     * ```
     */
    readSync(p: Uint8Array): number | null;
    /** Seek to the given `offset` under mode given by `whence`. The call
     * resolves to the new position within the resource (bytes from the start).
     *
     * ```ts
     * // Given the file contains "Hello world" text, which is 11 bytes long:
     * using file = await Deno.open(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello world"));
     *
     * // advance cursor 6 bytes
     * const cursorPosition = await file.seek(6, Deno.SeekMode.Start);
     * console.log(cursorPosition);  // 6
     * const buf = new Uint8Array(100);
     * await file.read(buf);
     * console.log(new TextDecoder().decode(buf)); // "world"
     * ```
     *
     * The seek modes work as follows:
     *
     * ```ts
     * // Given the file contains "Hello world" text, which is 11 bytes long:
     * const file = await Deno.open(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello world"));
     *
     * // Seek 6 bytes from the start of the file
     * console.log(await file.seek(6, Deno.SeekMode.Start)); // "6"
     * // Seek 2 more bytes from the current position
     * console.log(await file.seek(2, Deno.SeekMode.Current)); // "8"
     * // Seek backwards 2 bytes from the end of the file
     * console.log(await file.seek(-2, Deno.SeekMode.End)); // "9" (i.e. 11-2)
     * ```
     */
    seek(offset: number | bigint, whence: SeekMode): Promise<number>;
    /** Synchronously seek to the given `offset` under mode given by `whence`.
     * The new position within the resource (bytes from the start) is returned.
     *
     * ```ts
     * using file = Deno.openSync(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello world"));
     *
     * // advance cursor 6 bytes
     * const cursorPosition = file.seekSync(6, Deno.SeekMode.Start);
     * console.log(cursorPosition);  // 6
     * const buf = new Uint8Array(100);
     * file.readSync(buf);
     * console.log(new TextDecoder().decode(buf)); // "world"
     * ```
     *
     * The seek modes work as follows:
     *
     * ```ts
     * // Given the file contains "Hello world" text, which is 11 bytes long:
     * using file = Deno.openSync(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello world"));
     *
     * // Seek 6 bytes from the start of the file
     * console.log(file.seekSync(6, Deno.SeekMode.Start)); // "6"
     * // Seek 2 more bytes from the current position
     * console.log(file.seekSync(2, Deno.SeekMode.Current)); // "8"
     * // Seek backwards 2 bytes from the end of the file
     * console.log(file.seekSync(-2, Deno.SeekMode.End)); // "9" (i.e. 11-2)
     * ```
     */
    seekSync(offset: number | bigint, whence: SeekMode): number;
    /** Resolves to a {@linkcode Deno.FileInfo} for the file.
     *
     * ```ts
     * import { assert } from "jsr:@std/assert";
     *
     * using file = await Deno.open("hello.txt");
     * const fileInfo = await file.stat();
     * assert(fileInfo.isFile);
     * ```
     */
    stat(): Promise<FileInfo>;
    /** Synchronously returns a {@linkcode Deno.FileInfo} for the file.
     *
     * ```ts
     * import { assert } from "jsr:@std/assert";
     *
     * using file = Deno.openSync("hello.txt")
     * const fileInfo = file.statSync();
     * assert(fileInfo.isFile);
     * ```
     */
    statSync(): FileInfo;
    /**
     * Flushes any pending data and metadata operations of the given file
     * stream to disk.
     *
     * ```ts
     * const file = await Deno.open(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello World"));
     * await file.truncate(1);
     * await file.sync();
     * console.log(await Deno.readTextFile("my_file.txt")); // H
     * ```
     *
     * @category I/O
     */
    sync(): Promise<void>;
    /**
     * Synchronously flushes any pending data and metadata operations of the given
     * file stream to disk.
     *
     * ```ts
     * const file = Deno.openSync(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello World"));
     * file.truncateSync(1);
     * file.syncSync();
     * console.log(Deno.readTextFileSync("my_file.txt")); // H
     * ```
     *
     * @category I/O
     */
    syncSync(): void;
    /**
     * Flushes any pending data operations of the given file stream to disk.
     *  ```ts
     * using file = await Deno.open(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello World"));
     * await file.syncData();
     * console.log(await Deno.readTextFile("my_file.txt")); // Hello World
     * ```
     *
     * @category I/O
     */
    syncData(): Promise<void>;
    /**
     * Synchronously flushes any pending data operations of the given file stream
     * to disk.
     *
     *  ```ts
     * using file = Deno.openSync(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello World"));
     * file.syncDataSync();
     * console.log(Deno.readTextFileSync("my_file.txt")); // Hello World
     * ```
     *
     * @category I/O
     */
    syncDataSync(): void;
    /**
     * Changes the access (`atime`) and modification (`mtime`) times of the
     * file stream resource. Given times are either in seconds (UNIX epoch
     * time) or as `Date` objects.
     *
     * ```ts
     * using file = await Deno.open("file.txt", { create: true, write: true });
     * await file.utime(1556495550, new Date());
     * ```
     *
     * @category File System
     */
    utime(atime: number | Date, mtime: number | Date): Promise<void>;
    /**
     * Synchronously changes the access (`atime`) and modification (`mtime`)
     * times of the file stream resource. Given times are either in seconds
     * (UNIX epoch time) or as `Date` objects.
     *
     * ```ts
     * using file = Deno.openSync("file.txt", { create: true, write: true });
     * file.utime(1556495550, new Date());
     * ```
     *
     * @category File System
     */
    utimeSync(atime: number | Date, mtime: number | Date): void;
    /**
     * Checks if the file resource is a TTY (terminal).
     *
     * ```ts
     * // This example is system and context specific
     * using file = await Deno.open("/dev/tty6");
     * file.isTerminal(); // true
     * ```
     */
    isTerminal(): boolean;
    /**
     * Set TTY to be under raw mode or not. In raw mode, characters are read and
     * returned as is, without being processed. All special processing of
     * characters by the terminal is disabled, including echoing input
     * characters. Reading from a TTY device in raw mode is faster than reading
     * from a TTY device in canonical mode.
     *
     * ```ts
     * using file = await Deno.open("/dev/tty6");
     * file.setRaw(true, { cbreak: true });
     * ```
  