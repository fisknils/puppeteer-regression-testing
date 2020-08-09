const puppeteer = require( 'puppeteer' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	promisify = require( 'util' ).promisify,
	mkdir = promisify( fs.mkdir ),
	access = promisify( fs.access );

const sleep = ( ms ) => new Promise( resolve => setTimeout( resolve, ms ) );

const take_screenshot_multiview = ( async ( options, statusCallback ) => {
	const report = ( type, payload ) => statusCallback( { type, payload } );
	const log = ( action, payload ) => report( 'status', { action, payload } );
	const result = payload => report( 'result', payload );
	const error = payload => log( 'error', payload );
	const progress = payload => log( 'progress', payload );
	const start = () => progress( 'start' );
	const stop = () => progress( 'stop' );
	const complete = () => progress( 'complete' );
	const { puppeteer_options } = options;

	const section = ( statusText, fn => {
		console.log( 'starting:', statusText );
		try
		{
			fn();
		} catch ( e )
		{
			console.error( 'Exception: ', e );
			process.exit( 1 );
		} finally
		{
			console.log( 'success:', statusText );
		}
	} );

	let control = 'running';

	start();

	report( 'controller', ( command ) => {
		if ( command === 'stop' )
		{
			control = 'stop';
		}
	} );

	log( 'Launching browser', Object.assign( {}, puppeteer_options.launch ) ); // ----------- log point
	const browser = await puppeteer.launch( Object.assign( {}, puppeteer_options.launch ) ).catch( error );

	log( 'Opening tab', Object.assign( {}, puppeteer_options.newPage ) ); // ----------- log point
	const page = await browser.newPage( Object.assign( {}, puppeteer_options.newPage ) ).catch( error );

	log( 'Checking target dir access', options.path_prefix ); // ----------- log point
	await access( options.path_prefix, fs.constants.F_OK )
		.catch( e => mkdir( options.path_prefix ) );

	const { inject_js, injected_js } = options;

	for ( let ui in options.urls )
	{
		if ( control === 'stop' )
		{
			stop();
			return;
		}
		let url = options.urls[ ui ].replace( /^([^ ]+).*/, '$1' );
		let selectors = [ 'html > body' ];
		if ( options.urls[ ui ].match( ' ' ) )
		{
			selectors.concat( options.urls[ ui ].split( ' ' ).splice( 1 ).join( ' ' ).split( ',' ) );
		}

		log( 'Waiting for network', url ); // ----------- log point
		await page.goto( url, Object.assign( {}, puppeteer_options.goto ) ).catch( errorMessage => error( { url, errorMessage } ) );

		if ( inject_js )
		{
			log( 'Evaluating injected js', injected_js ); // ----------- log point
			await page.evaluate( eval( injected_js ) )
				.then( () => sleep( 1000 ) )
				.catch( ( e ) => {
					error( { 'source': 'injected js', 'exception': e } );
					stop();
				} );
		}

		for ( let p in options.viewports )
		{
			let viewport = options.viewports[ p ];
			let opts = {
				width: +viewport,
				height: 100
			};

			log( 'setViewport', opts ); // ----------- log point
			await page.setViewport( opts )
				.then( () => sleep( 1000 ) )
				.catch( errorMessage => error( { url, viewport, errorMessage } ) );

			for ( let si in selectors )
			{
				const selector = selectors[ si ];

				let output_file = path.join(
					options.path_prefix,
					[
						url.replace( /:/g, '' ).replace( /\//g, '_' ).replace( /\?/g, '_' ),
						'_',
						viewport,
						' ',
						selector,
						'.png'
					].join( '' )
				);

				opts = {
					path: output_file,
				};

				log( 'capture screenshot', { selector, opts } ); // ----------- log point

				let element = await page.$( selector );
				await element.screenshot( opts )
					.then( () => result( { url, viewport, output_file, selector } ) )
					.catch( errorMessage => error( { url, viewport, output_file, selector, errorMessage } ) );
			}
		}
	}
	complete();
	await browser.close();
} );

module.exports = take_screenshot_multiview;
