interface ReeasyConfig {
	/**
	 * Current work directory, use `process.cwd()` by default
	 */
	cwd: string
	/**
	 * Is in development mode, default `false`
	 */
	dev: boolean
	/**
	 * Custom `reeasy.config.js` file path when in format of string;  
	 * Object exported in `reeasy.config.js` file when in format of object
	 */
	conf: string | object
}

interface ReeasyMiddleware {
}

interface Reeasy {
	/**
	 * Prepare middleware
	 */
	prepare(): Promise<ReeasyMiddleware>
}

declare module "reeasy" {
	/**
	 * Create Reeasy instance
	 * @param opts 
	 */
	function create(opts: ReeasyConfig): Reeasy

	export = create
}