const cli = require('cli')
	resemble = require('node-resemble-js'),
	path = require('path'),
	fs = require('fs');

let [ file1, file2, file3 ] = process.argv.splice(2);
file1 = path.resolve( file1 );
file2 = path.resolve( file2 );
file3 = path.resolve( file3 );

const compareFiles = () => {
	return new Promise((resolve,reject) => {
		resemble( file1 )
			.compareTo( file2 )
			.onComplete( resolve );
	})
}

const main = (async () => {
	let data = await compareFiles();
	data.getDiffImage().pack().pipe( fs.createWriteStream( file3 ))
});

main();
