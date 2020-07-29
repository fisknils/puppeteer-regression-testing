const puppeteer = require('puppeteer'),
	cli = require('cli'),
	path = require('path'),
	conf = require('./config'),
	fs = require('fs'),
	{ main } = require('cli'),
	promisify = require('util').promisify,
	mkdir = promisify( fs.mkdir ),
	access = promisify( fs.access );


const paths = () => {
	prefix: ( session  => path.resolve( 'images' ) ),
	path_exists: ( fullpath ) => access( path, fs.constants.F_OK ).then( true ).catch( false ),
	maybe_mkdir: async ( fullpath => {
		if ( await access( path, fs.constants.F_OK ).then( () => true ).catch( () => false ) ) {
			return true;
		}
	})
}

const options = (() => {
	const opts = cli.parse( {
		url: ['u', 'An url to process', 'url', false],
		session: ['s', 'Session name', 'string', false],
	} );

	if ( ! opts.url || ! opts.session ) {
		console.log( 'at least -u (url) and -s (session name) needs to be set');
		process.exit();
	}

	opts.filename = opts.url.replace(/\//g, '-').replace(/:/g, '');
	opts.path_prefix = path.resolve('images', opts.session);

	return Object.assign( opts, conf );
})();

const sleep = ( msecs => {
	return new Promise( ( resolve, reject ) => {
		setTimeout( resolve, msecs );
	});
});

const take_screenshot = (async ( url, viewport, file ) => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await access( options.path_prefix, fs.constants.F_OK )
		.catch( e => mkdir( options.path_prefix ) );

	await page.setViewport(viewport);

	await page.goto( options.url, conf.gotoOption );

	await page.screenshot({
		fullPage: true,
		path: file,
	});

	await browser.close();
});

const take_screenshot_multiview = ( async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await access( options.path_prefix, fs.constants.F_OK )
			.catch(e => mkdir( options.path_prefix ) );

		await access(options.path_prefix, fs.constants.F_OK)
			.catch(e => mkdir(options.path_prefix));

		await page.goto(options.url, conf.gotoOption);

		for ( let p in options.viewports ) {
				let viewport = options.viewports[p],
					output_file = path.join(
							options.path_prefix,
							`${options.filename}_${p}.png`
							.replace(/^.+?\-\-/, '')
					);

				await page.setViewport( viewport );

				await page.screenshot({
						fullPage: true,
						path: output_file,
				})

				console.log ( output_file );
			}

    await browser.close();
});



/*
( async () => {
	let promises = [];

	for( let p in options.viewports ) {
		let viewport = options.viewports[ p ],


		 promises.push( take_screenshot_multiview( options.url, viewport, output_file ) );
	}
	await Promise.all( promises );
} )();
*/

take_screenshot_multiview();
