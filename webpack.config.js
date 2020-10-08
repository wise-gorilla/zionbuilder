const path = require('path')
const {
	mergeConfigs
} = require('@zionbuilder/webpack-config');

const {
	readdirSync,
	existsSync
} = require('fs')


const configs = []

const getDirectories = source =>
	readdirSync(source, {
		withFileTypes: true
	})
	.filter(dirent => dirent.isDirectory())
	.map(dirent => dirent.name)

const getWebpackConfig = (folder) => {
	const webpackFileLocation = path.resolve( folder, 'webpack.config.js' )
	return existsSync( webpackFileLocation ) ? webpackFileLocation : false
}

// const packages = getDirectories('./packages')

const packages = [
	'admin',
	'components',
	'editor',
	'hooks',
	'i18n',
	'rest',
	'utils',
	'vue',
	'edit-page',
	'gutenberg',
	'preview'
]

packages.forEach(directory => {
	const folder = path.resolve('./packages', directory)
	const webpackConfig = getWebpackConfig(folder)

	if (webpackConfig) {
		const packageWebpackConfig = require(webpackConfig)
		const config = mergeConfigs(
			packageWebpackConfig,
			{
				entry: {
					[directory]: packageWebpackConfig.entry
				},
				// Change context to package folder so that webpack knows where to look for files
				context: folder,
				// Export all packages to window.zb
				output: {
					filename: `js/${directory}.js`,
					library: [ 'zb', directory ],
					libraryTarget: 'window'
				},
				externals: [
					// /^@zionbuilder\/[packages.join('|')]/
					function( context, request, callback ) {
						// Convert packages to window.zb[package]
						let matcher = new RegExp("@zionbuilder/(" + packages.join('|') + ")");
						if (matcher.test(request)){
							const modules = request.replace('@zionbuilder', 'zb').split('/')
							// Externalize to a commonjs module using the request path
							return callback(null, modules, 'root');
						}
						callback()
					}
				]
			}
		)

		configs.push(config)
	}
})

module.exports = configs