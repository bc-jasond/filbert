import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

import {API_URL} from '@filbert/constants';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

const onwarn = (warning, onwarn) => (warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) || onwarn(warning);

const env = {
	'process.env.ENCRYPTION_KEY': JSON.stringify(process.env.ENCRYPTION_KEY),
	'process.env.NODE_ENV': JSON.stringify(mode),
	'process.env.API_URL': JSON.stringify(API_URL),
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
				dev
			}),
			resolve({
				dedupe: ['svelte']
			}),
			commonjs(),
			babel(babelConfig),
		],
		external: Object.keys(pkg.dependencies).concat(
			require('module').builtinModules || Object.keys(process.binding('natives'))
		),

		preserveEntrySignatures: 'strict',
		onwarn,
	},

	serviceworker: {
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				...env
			}),
			commonjs(),
			!dev && terser()
		],

		preserveEntrySignatures: false,
		onwarn,
	},
};
