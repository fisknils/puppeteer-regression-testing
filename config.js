/*
$grid_breakpoint - s: 576;
$grid_breakpoint - m: 768;
$grid_breakpoint - l: 992;
$grid_breakpoint - xl: 1200;
*/


module.exports = {
	viewports: {
			'360px': {
				width: 360,
				height: 600,
			},
	    '577px': {
	        width: 577,
	        height: 600,
			},
			'769px': {
				width: 769,
				height: 600,
			},
	    '993px': {
	        width: 993,
	        height: 800,
	    },
	    '1201px': {
	        width: 1201,
	        height: 800,
	    },
	},
	gotoOption: { // https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-pagegotourl-options
		waitUntil: 'networkidle0', // "load"|"domcontentloaded"|"networkidle0"|"networkidle2"|Array
		timeout: 0,
	}
}
