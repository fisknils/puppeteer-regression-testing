import Puppeteer from 'puppeteer';
import Queue from './Queue';


class Screenshot {
	// Puppeteer Browser object
	browser;

	// Puppeteer Page obje t
	page;

	// Array of viewports
	viewports;

	// Array of urls
	urls;

	// Array of queue
	queue;

	// full path to screenshot dir
	screenshot_dir;

	// bool deciding if we're ready.
	isReady;

	constructor( urls, viewports, screenshot_dir ) {
		this.urls = urls;
		this.viewports = viewports;
		this.screenshot_dir = screenshot_dir;

		this.init();
	}

	async init() {
		this.browser = await Puppeteer.launch();
		this.page = await browser.newPage();

		this.ready();
	}

	ready() {
		this.isReady = true;
		this.setInterval( this.checkForWork, 1000 );
	}

	checkForWork() {
		if ( ! this.isReady ) return;
		if ( ! this.queue.length ) return;

		let url = this.queue.splice( 0, 1 );
		this.isReady = false;
		await this.processURL( url );
		this.isReady = true;
	}

	addUrl( url ) {
		this.urls.push( url );

		if ( this.urls.length > 1 ) {
			this.comparisonMode = true;
		}
	}

	addViewport( viewport ) {
		this.viewports.push( viewport );
	}

	async capture( file ) {
		let queue = [], specs = [];

		for( let url_i in this.urls ) {
			let url = this.urls[ url_i ];

			for( let vp_i in this.viewports ) {
				let viewport = this.viewports[ vp_i ], promise;

				promise = this.captureSingle( url, viewport );

				this.queue.push( promise );
				specs.push( { url: url, viewport: viewport, promise: promise } );
			}
		}
	}

	async maybe_wait( queue ) {
		while ( 5 >= queue.length ) {
			await Promise.race( queue );
		}
	}

	async captureSingle( url, viewport ) {

	}
}
