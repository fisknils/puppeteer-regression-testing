import { ScreenshotClient } from "./ScreenshotClient";
import { readFile } from "fs/promises";
import { resolve } from "path";

process.on( 'unhandledRejection', console.error );
process.on( 'uncaughtException', console.error );

const testItem = {
  URLs: [
    new URL( "file:///" + resolve( __dirname, "../tests", "source.html" ) ),
    new URL( "file:///" + resolve( __dirname, "../tests", "target.html" ) ),
  ],
  Viewports: [ 320 ],
  InjectJS: {
    enabled: false,
    script: "",
  },
};

let client = new ScreenshotClient();

afterAll( () =>
{
  client = null;
} );

const sleep = ( ms ) =>
  new Promise( ( resolve ) =>
  {
    setTimeout( resolve, ms );
  } );

describe( "ScreenshotClient", () =>
{
  it( "Constructs", async () =>
  {
    expect.assertions( 1 );
    expect( client ).toBeInstanceOf( ScreenshotClient );
  } );

  it( "Compares", async () =>
  {
    expect.assertions( 1 );

    const diff: Promise<boolean> = new Promise( resolve => client.onResult( resolve ) )
      .then( ( got: any ) =>
      {
        return readFile( resolve( __dirname, '../tests/expectedResult.json' ), { encoding: 'utf-8' } )
          .then( raw => JSON.parse( raw ) )
          .then( expected =>
          {
            for ( let p in expected )
            {
              if ( got[ p ] !== expected[ p ] )
              {
                const { Screenshots } = got;
                console.error( 'mismatch', { p, got, Screenshots, expected } );
                return false;
              }
            }
            return true;
          } )
          .catch( ( e ) => { console.error( e ); return false; } );
      } )
      .catch( ( e ) => { console.error( e ); return false; } );

    client.addJob( testItem );
    await expect( diff ).resolves.toEqual( true );
  } );
} );
