export default class Queue {
	threads: [];
	limit: 5;

	async add( callback ) {
		this.threads.push(
			new Promise(
				(resolve,reject) => {
					callback()
						.then( resolve )
						.catch( reject );
				}
			)
		);

		while ( this.threads.length >= this.limit ) {
			await Promise.race( this.threads )
				.then( winner => {
					console.log( this.threads );
				} );
		}
	}
};
