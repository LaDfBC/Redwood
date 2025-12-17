import { Liquibase, POSTGRESQL_DEFAULT_CONFIG } from 'node-liquibase';
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
let Config = require('../config/config.prod.json');

const devConfig = {
    ...POSTGRESQL_DEFAULT_CONFIG,
    changeLogFile: '.schema/changelog.xml',
    url: `jdbc:postgresql://${Config.database.host}:5432/${Config.database.database}`,
    username: Config.database.username,
    password: Config.database.password,
}


const instTs = new Liquibase(devConfig);
// console.warn(inst.status())
instTs.update({});