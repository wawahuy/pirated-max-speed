export const configs = {
    /**
     * Cache size in app
     *
     */
    cacheMaxSize: 1024 * 1024 * 1024,


    /**
     * Root App Directory
     *
     */
    rootAppDir: process.env.rootAppDir || "",


    proxyPort: 1234,
    debugPort: 1235
}