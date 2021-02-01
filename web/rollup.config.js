import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';
import svelte from 'rollup-plugin-svelte';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

import config from 'sapper/config/rollup.js';
import pkg from './package.json';

//TODO: can't import this mjs module here for some reason, it ends up getting "require()d" in sapper somewhere...
// import {saneEnvironmentOrExit} from '@filbert/util';
function saneEnvironmentOrExit(...requiredVars) {
	const { env } = process;
	const missingEnvVariables = requiredVars.filter((key) => !env[key] && key);
	if (missingEnvVariables.length > 0) {
		console.error(
			`❌ process.env not sane!\n\nThe following variables are missing:\n${missingEnvVariables.join(
				'\n'
			)}`
		);
		process.exit(1);
	}
}
saneEnvironmentOrExit('ENCRYPTION_KEY', 'NODE_ENV','GOOGLE_API_FILBERT_CLIENT_ID')

const dev = process.env.NODE_ENV !== 'production';

const onwarn = (warning, onwarn) =>
	(warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
	(warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) ||
	onwarn(warning);

const env = {
	'process.env.ENCRYPTION_KEY': JSON.stringify(process.env.ENCRYPTION_KEY),
	'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
	'process.env.GOOGLE_API_FILBERT_CLIENT_ID': JSON.stringify(process.env.GOOGLE_API_FILBERT_CLIENT_ID)
}

const babelConfig = {
	extensions: ['.js', '.mjs', '.html', '.svelte'],
	babelHelpers: 'runtime',
	exclude: ['node_modules/@babel/**'],
	presets: [
		['@babel/preset-env', {
			targets: {
				node: "current",
			}
		}]
	],
	plugins: [
		"@babel/plugin-proposal-class-properties",
		"@babel/plugin-proposal-optional-chaining",
		'@babel/plugin-syntax-dynamic-import',
		['@babel/plugin-transform-runtime', {
			useESModules: true
		}]
	]
};

module.exports = {
	client: {
		input: config.client.input(),
		output: config.client.output(),
		plugins: [
			replace({
				'process.browser': true,
				...env
			}),
			svelte({
				dev,
				hydratable: true,
				emitCss: true
			}),
			resolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs(),

			babel(babelConfig),

			!dev && terser({
				module: true
			})
		],

		preserveEntrySignatures: false,
		onwarn,
	},

	server: {
		input: config.server.input(),
		output: config.server.output(),
		plugins: [
			replace({
				'process.browser': false,
				...env
			}),
			svelte({
				generate: 'ssr',
				hydratable: true,
				dev
			}),
			url({
				sourceDir: path.resolve(__dirname, 'src/node_modules/images'),
				publicPath: '/client/',
				emitFiles: false // already emitted by client build
			}),
			resolve({
				dedupe: ['svelte']
			}),
			commonjs(),
			babel(babelConfig),
		],
		external: Object.keys(pkg.dependencies).concat(require('module').builtinModules),

		preserveEntrySignatures: 'strict',
		onwarn,
	},
};
