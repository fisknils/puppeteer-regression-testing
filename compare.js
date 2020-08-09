const resemble = require( 'node-resemble-js' );
const fs = require( 'fs' );
const imageToBase64 = require( 'image-to-base64' );

const compareFiles = ( file1, file2 ) => {
	return new Promise( ( resolve, reject ) => {
		resemble( file1 )
			.compareTo( file2 )
			.onComplete( resolve );
	} );
};

const imgCompare = ( async ( file1, file2, file3 ) => {
	let data = await compareFiles( file1, file2 );
	await new Promise( ( resolve, reject ) => {
		data.getDiffImage().pack().pipe( fs.createWriteStream( file3 ).on( 'close', resolve ) );
	} );

	data.screenshots = {
		dev: await imageToBase64( file1 ),
		prod: await imageToBase64( file2 ),
		diff: await imageToBase64( file3 )
	};

	return data;
} );

module.exports = imgCompare;
