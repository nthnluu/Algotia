const Sequelize = require('sequelize');
const ccxt = require('ccxt');
const fs = require('fs');
const Ajv  = require('ajv');

const getConfig = require('./config/getConfig');
const { kill } = require('./utils/index')

module.exports = async () => {
    try {
        
        let bootData = {};

        const config = await validateConfig();
        const store = await connectStore();
        const exchange = await connectExchange(config);

        bootData.config = config;
        bootData.db = store;
        bootData.exchange = exchange;

        return bootData;
        
    } catch (err) {

        console.log('Error in boot phase: ', err);

    }
}

const validateConfig = async () => {
    try {
        // Schema is generated at build-time with typescript-json-schema
        const schemaFile = fs.readFileSync(`${__dirname}/config/configSchema.json`, 'utf8');
        const configScehma = JSON.parse(schemaFile);

        const config = getConfig();
        const ajv = new Ajv();
        const validate = ajv.compile(configScehma);
        const valid = validate(config);


        if(valid){

            console.log('Configuration validated');
            return config

        } else {

            validate.errors.forEach((errorObj)=>{
                console.log(`Error while validating schema: ${errorObj.dataPath}: ${errorObj.message}`);
            });
            kill();

        }

    } catch (err) {

        console.log('Error validating configuration: ', err);

    }
}

const connectExchange = async (config) => {
    try {

        const { exchangeId, apiKey, secret, timeout } = config.exchange;   

        const exchange = new ccxt[exchangeId]({
            apiKey,
            secret,
            timeout
        });

        return exchange;

    } catch (err) {

        console.log(err);

    }
}

const connectStore = async () => {
    try {
        // connect to db and return intance
        let dbPath = `${__dirname}/db/store.sqlite`
        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: dbPath,
            logging: false
        })
        await sequelize.authenticate();
        console.log('Connected to databse');
        
        return sequelize;

    } catch (err) {

        console.log('Error connecting to databse: ', err);

    }
 }
