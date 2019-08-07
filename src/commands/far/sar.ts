import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('far', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  ];

  protected static flagsConfig = {
    inputdir: flags.directory({ char: 'i', description: 'Input directory' }),
    dictionary: flags.directory({char: 'd', description: 'Dictionary File'}),
    prefix: flags.string({char: 'p', description: 'Translated word prefix'}),
    suffix: flags.string({char: 's', description: 'Translated word suffix'}),
    includeoverlay: flags.boolean({char: 'o', description: 'Should replaced value keep overlay'})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  protected replacedItems = 0;
  protected replacedValues = [];

  public async run(): Promise<AnyJson> {
    const replace = require('replace-in-file');
    const fs = require('fs');
    const csv = require('csv-parser')
    let dictionary = [];

    try {
      fs.createReadStream(this.flags.dictionary)
        .pipe(csv())
        .on('data', (data) => dictionary.push(data))
        .on('end', () => {
          this.ux.log(dictionary.length.toString() + ' - entries found in dictionary');
          this.translate(replace, dictionary, this.flags.inputdir);
          this.ux.log(this.replacedItems + ' - entries replaced');
      });



    }
    catch (error) {
      throw new SfdxError(messages.getMessage('errorNoOrgResults', [error]));
    }
    /*
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoOrgResults', [this.org.getOrgId()]));
    }

    this.ux.log(outputString);
*/

    // Return an object to be displayed with --json
    return {"replaced" : this.replacedValues};
  }

  public translate(replace, dictionary, inputdir){
    for(let value of dictionary){
      let regex = new RegExp(this.flags.prefix + value.Name + this.flags.suffix, 'gi');
      let toValue = this.flags.includeoverlay === true ? this.flags.prefix + value.Translation + this.flags.suffix : value.Translation;
	  let options = {
        encoding: 'utf8',
        files: inputdir,
        from: regex,
        to: toValue,
      };
      let results = replace.sync(options);
	  //console.log(results);
      if(results[0].hasChanged){
        this.replacedItems++;
        this.replacedValues.push(value.Name);
      }

    }
  }
}
