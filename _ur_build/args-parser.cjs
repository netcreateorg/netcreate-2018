/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  skeleton code for using yargs

  .option( key, options )
  .position( key, options )
  .command( command, description, builder?, handler? )
  .usage( string )
  .help()
  .version( version, option?, description? )
  .example( command, description )
  .demandOption( keys, msg? )
  .default( key, value, description )
  .alias( key, alias )
  .array( key )
  .nargs( key, count )
  .describe( key, description )
  .requiresArg( key )
  .choices( key, choices )
  .check( fn )
  .middleware( fn )
  .eiplogue( msg )
  .wrap( columns )
  .strict()

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const yargs = require('yargs');

// program greet --name John
yargs
  .command({
    command: 'greet',
    describe: 'greet',
    builder: {
      name: {
        describe: 'arg1',
        demandOption: true,
        type: 'string'
      }
    },
    handler: argv => {
      console.log(`hello ${argv.name}`);
    }
  })
  .help().argv;
