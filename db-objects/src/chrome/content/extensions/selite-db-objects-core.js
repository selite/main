"use strict";

Components.utils.import( "chrome://selite-db-objects/content/Db.js" ); // this loads 'SeLiteData' object into Selenium Core scope, so that it can be used by Selenese
Components.utils.import( "chrome://selite-db-objects/content/DbStorage.js" );
Components.utils.import( "chrome://selite-db-objects/content/DbObjects.js" );
Components.utils.import( "chrome://selite-db-objects/content/DbFunctions.js" );

// Following assignments is purely for JSDoc.
/** @class */
Selenium= Selenium;

/** Async or sync read of a record and put in a stored variable. We can't imlement this as getReadRecord() for asynchronous - see Selenium.prototype.handlePotentialPromise().
 * This is not called doStoreRecord as it would be confusing/counter-intuitive: it could imply that it's storing something in the DB, while it would be retrieving a record from the DB and storing it in a stored variable.
 * */
Selenium.prototype.doStoreReadRecord= function doStoreReadRecord( info, storedVariableName ) {
    /** @type {SeLiteData.Table} */
    var table;
    /** @type SeLiteData.RecordSetFormula*/
    var formula;
    LOG.debug( 'getReadRecord info: ' +typeof info+ ': ' +SeLiteMisc.objectToString(info, 2));
    if( 'table' in info ) {
        table= info.table;
        table instanceof SeLiteData.Table || SeLiteMisc.fail( 'info.table must be an instance of SeLiteData.Table');
        formula= table.formula();
    }
    else if( 'formula' in info ) {
        formula= info.formula;
        formula instanceof SeLiteData.RecordSetFormula || SeLiteMisc.fail( 'info.formula must be an instance of SeLiteData.RecordSetFormula');
        table= formula.table;
    }
    else {
        SeLiteMisc.fail('getReadRecord() expects info.table or info.formula to be present.');
    }
    info.dontNarrow= SeLiteMisc.field( info, 'dontNarrow', false );
    SeLiteMisc.ensureType( info.dontNarrow, 'boolean' );
    info.sync= SeLiteMisc.field( info, 'sync', false );
    SeLiteMisc.ensureType( info.sync, 'boolean' );
    /**@type {object}*/var matchingPairs= SeLiteMisc.objectClone(info, table.columns );
    //delete matchingPairs.info;
    //delete matchingPairs.formula;
    // Following check depends on requirement that either info.table or info.formula is present, but not both.
    Object.keys(matchingPairs).length===Object.keys(info).length-3/*3 extra fields: (table or formula),sync,dontNarrow*/ || SeLiteMisc.fail( 'There are some field(s) in info.matchingPairs that are not present in table/formula definition.' );

    return this.handlePotentialPromise(
        formula.select( matchingPairs, info.dontNarrow, info.sync ),
        records => {
            var record;
            // @TODO for(record of records):
            for( var key in records ) { // Return the only record, if any:
                if( record ) {
                    throw new Error( 'There is more than one record.' );
                }
                record= records[key];
                LOG.debug( 'getReadRecord: ' +records );
                LOG.debug( 'record: ' +SeLiteMisc.objectToString(record, 2) );
                storedVars[storedVariableName]= record;
            }
            if( ! record ) {
                throw new Error( "There are no records.");
            }
        },
        !info.sync
    );
};

/** Insert a record to the table. It sets primary key value in recordObject, if appropriate.
 *  @param {object} recordObject
 *  @param {SeLiteData.Table} table
 *  @return {Promise} Promise of undefined.
 * */
Selenium.insertRecord= function insertRecord( recordObject, tableOrCompound ) {
    var record= new SeLiteData.Record(recordObject);
    var passedCompound= 'table' in tableOrCompound;
    var table= passedCompound
        ? tableOrCompound.table
        : tableOrCompound;
    var sync= SeLiteMisc.field(tableOrCompound, 'sync', false);
    !sync || passedCompound || SeLiteMisc.fail( "Only set .sync on a compound object, not on the table object." );
    var inserting= table.insert( record, sync );
    inserting= Promise.resolve( inserting );
    
    if( typeof table.primary==='string'/*Primary key is 1 column, not an array*/
        && SeLiteMisc.field(recordObject, table.primary)===undefined
        // @TODO move the following as a validation to the promise .then() below?
        //&& SeLiteMisc.field(record, table.primary)!==undefined
    ) {
        inserting= inserting.then(
            ignored => {
                recordObject[ table.primary ]= storedVars.insertedRecordKey= record[table.primary];
                return undefined;
            }
        );
    }
    return inserting;
};

/** Insert a record. Update primary key in recordObject, if it's one column-based and it was not specified (hence it was autogenerated). For narrowing, see action insertRecordCaptureKey instead.
 *  @param {object} recordObject
 *  @param {SeLiteData.Table} table
 */
Selenium.prototype.doInsertRecord= function doInsertRecord( recordObject, tableOrCompound) {
    return this.handlePromise( Selenium.insertRecord(recordObject, tableOrCompound) );
};

/** @param {string|function} recordKeyAttributeLocator An attribute locator (ending with @attributeName), or a JS function that accepts Selenium object as its parameter - function(selenium) - and returns an attribute value, for an element that represents a primary key for this record.
 @TODO Refer from Docs:<br/>Narrowing is for sharing the same app DB with (potentially) separate script DBs (instances). If narrowing down
 - auto-generated primary keys in those DBs wouldn't match. For that this action <code>insertRecordCaptureKey</code> captures the primary key value from the screen.
 - the records (in app DB) need to be identified with their respective script DB. That is done by SeLiteData.Table's narrower.inject(). Then this action <code>insertRecordCaptureKey</code> requires that the given element has a value that has already been narrowed down (by passing through .inject() on the table's narrower object).
In real script runs SeLiteSettings field 'alwaysTestGeneratingKeys' usually reflects whether field 'narrowBy' is undefined. However, 'alwaysTestGeneratingKeys' can be true to test generating the keys at the same time as narrowing down by setting 'narrowBy'. That tests inner workings.
 *  @param {object} compound { object record, SeLiteData.Table table, [boolean sync]}
 * */
Selenium.prototype.doInsertRecordCaptureKey= function doInsertRecordCaptureKey( recordKeyAttributeLocator, compound ) {
    compound.table.narrowColumn || SeLiteMisc.fail( "Table " +compound.table.name+ " doesn't use narrowColumn." );
    !( compound.table.primary in compound.record ) || SeLiteMisc.fail( "Expected to generate or capture primary key for table " +compound.table.name+ ", but it was already set to a " +compound.record[compound.table.primary]+ '.' );
    var capturedPrimaryValue= typeof recordKeyAttributeLocator==="string"
        ? this.getAttribute( recordKeyAttributeLocator )
        : recordKeyAttributeLocator( this );
        
    var settings= SeLiteSettings.Module.forName( 'extensions.selite-settings.common' );
    var storeCapturedKey= settings.getField( 'narrowBy' ).getDownToFolder()
                      && !settings.getField( 'alwaysTestGeneratingKeys' ).getDownToFolder();
    if( storeCapturedKey ) {
        compound.record[ compound.table.primary ]= capturedPrimaryValue;
    }
    // Once successful, the following sets compound.record[ compound.table.primary ] (unless it was set already).
    var inserting= Selenium.insertRecord( compound.record, {table: compound.table, sync: SeLiteMisc.field(compound, 'sync', false)} );
    
    if( !storeCapturedKey ) {
        inserting= inserting.then(
            ignored =>
            ''+capturedPrimaryValue===''+compound.record[ compound.table.primary ] || SeLiteMisc.fail( "Captured primary key value for table " +compound.table.name+ ": " +capturedPrimaryValue+ " differs to generated value: " +compound.record[ compound.table.primary ] )
        );
    }
    return this.handlePromise( inserting );
};

Selenium.prototype.doExecuteSQL= function doExecuteSQL( SQL, bindings={} ) {
    return this.handlePromise(
        SeLiteData.getStorageFromSettings().execute( SQL, bindings )
    );
};
/* Not used, because it executed the first command only. If need be, then use https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/mozIStorageConnection#executeAsync().
Selenium.prototype.doExecuteSQLscript= function doExecuteSQLscript( filePath, bindings={} ) {
    return this.doExecuteSQL( SeLiteSettings.readFile(filePath) , bindings );
};*/