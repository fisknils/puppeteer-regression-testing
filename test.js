const path = require('path');

const testFunc = async ( arg ) => {
	return 'ok';
}

( async () => {
	let test = await testFunc().then( true ).catch( false );
	console.log( test );

})();
