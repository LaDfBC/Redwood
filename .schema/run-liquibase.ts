import { Liquibase, POSTGRESQL_DEFAULT_CONFIG } from 'node-liquibase';
import {createRequire} from "node:module";


const myConfig = {
  ...POSTGRESQL_DEFAULT_CONFIG,
  changeLogFile: '.schema/changelog.xml',
  url: 'jdbc:postgresql://localhost:5432/online_pennant',
  username: 'pennant_user',
  password: 'pennanttest14#'
}
const instTs = new Liquibase(myConfig);
// console.warn(inst.status())
instTs.update({});